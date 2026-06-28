# Local Match Gameplay — Design

**Date:** 2026-06-28
**Scope:** Enrich the local (hotseat) 1v1 mode of Aeroliths: advanced capture rules, combat readability, first-move fairness, comfort features, plus a rules-page update.

Out of scope: AI/bot opponent, online play. The engine refactor below is intentionally bot-friendly so a bot can be added later.

---

## 1. Goals

1. **Capture depth** — add Same, Plus and Combo rules, each toggleable in setup.
2. **Combat readability** — capture preview on hover, element-bonus indicator, contested-edge highlight, capture-type label.
3. **Fairness** — choose starting player (A / B / Random); the *extra* stone (odd boards) goes to the player who does **not** start.
4. **Comfort** — undo last move, replay same config, tie-break, last-move / final-move indicators.
5. **Docs** — update the rules page to match the engine (including a current inaccuracy) and document the new rules.

---

## 2. Architecture

The capture logic moves out of `placeStone` into a **pure** function that returns the new board **and** rich events. Both the real move and the hover preview reuse it, so the preview is faithful by construction.

```
resolveCaptures(board, x, y, stone, player, elements, rules) -> { board, events }
```

- `placeStone` calls `resolveCaptures`, applies the resulting board, removes the played stone from hand, switches turn, sets `lastMove`, and finalizes on a full board.
- `previewCaptures(state, handIndex, x, y) -> CaptureEvent[]` runs `resolveCaptures` on a clone without mutating state, used purely for the hover preview.

This is the single source of truth for capture resolution. It lives in `app/game/engine/match.ts` and depends only on engine types (no Vue/network).

---

## 3. Data model (`app/game/engine/types.ts`)

```ts
export interface CaptureRules {
  same: boolean
  plus: boolean
  combo: boolean
}

export type Edge = 'up' | 'down' | 'left' | 'right'

export interface CaptureEvent {
  x: number
  y: number
  type: 'basic' | 'same' | 'plus' | 'combo'
  edge: Edge            // edge of the duel that caused the capture (for highlighting)
  elementDelta: -1 | 0 | 1  // element bonus applied; only meaningful for 'basic'
}
```

Additions to existing interfaces:

- `MatchConfig`: `rules: CaptureRules` (required), `startingPlayer?: Player` (default random handled by the caller).
- `MatchState`: `rules: CaptureRules`, `lastMove: { x: number; y: number } | null`.

`MatchState.winner` and `status` are unchanged.

---

## 4. Capture rule semantics

Resolution for a stone placed by `player` at `(x, y)`, in this order:

1. **Basic** — for each adjacent enemy stone: capture if
   `myEdge + elementBonus > theirOppositeEdge` (strictly greater).
   Emits `type: 'basic'` with the applied `elementDelta`.

2. **Same** — count sides where `myEdge === theirOppositeEdge` using **raw values (no element bonus)**, over existing neighbours. **Allied neighbours count toward the threshold.** If **≥ 2** sides match, capture every **enemy** neighbour among the matched sides. Emits `type: 'same'`.

3. **Plus** — for each side, compute `myEdge + theirOppositeEdge` (**raw values**). If the **same sum** occurs on **≥ 2** sides, capture the **enemy** neighbours on those sides. Emits `type: 'plus'`.

4. **Combo** — every stone flipped by Same or Plus runs **one more Basic pass** against *its* enemy neighbours; captures cascade (each newly flipped stone repeats a Basic pass). Combo does **not** re-trigger Same/Plus. Cascaded captures emit `type: 'combo'`.

**Key decisions (approved):**
- Same/Plus use **raw spike values**; the element bonus applies to **Basic only**.
- Capture comparison is **strictly greater** (`>`); ties never capture except via Same.
- A given cell is captured at most once per move; the first rule to claim it wins its `type` (Basic, then Same, then Plus, then Combo cascade on the rest).

Basic, Same and Plus are all evaluated against the neighbour stones **as they stand immediately after the new stone is placed but before any flip is applied** (original owners/values). All their captures are then applied together; Combo cascades afterwards from the Same/Plus flips. This makes resolution independent of the order in which Basic vs Same/Plus are checked.

Disabled rules (`rules.same/plus/combo === false`) are skipped entirely.

---

## 5. Visual feedback (`app/components/game/GameBoard.vue`, `GameStone.vue`)

### Hover preview
- When a hand stone is selected and the pointer is over / dragging above an empty cell, call `previewCaptures(state, selectedIndex, x, y)`.
- Cells in the result get a `preview-capture` class (green halo); the target cell shows a ghost outline of the stone.
- Recomputed when the hovered cell changes; cleared on drop / deselect. Pure-derived, never mutates state.

### Real-move resolution
Driven by the `events` returned from `placeStone`, reusing the existing capture-animation `watch` ([GameBoard.vue] capture watcher):
- **Contested edge** — the flip animation highlights the `edge` of each captured cell (glow/stroke on that border).
- **Element bonus** — when `elementDelta !== 0`, an ephemeral badge `+1` (green) / `−1` (red) on the edge, ~600 ms.
- **Capture type** — when a special rule fired this move, an ephemeral centered label “Same!” / “Plus!” / “Combo!” (label priority Combo > Plus > Same for the move).

All via scoped CSS + `setTimeout`, honoring `prefers-reduced-motion` (already handled).

---

## 6. Fairness (setup + `LocalMatch.vue`)

- Setup control for who starts: **A / B / Random** (default Random). Random is resolved when the match is created.
- The extra stone on odd boards goes to the **non-starting** player:
  - `handSize(player) = player === startingPlayer ? floor(cells/2) : ceil(cells/2)`
  - On even boards both hands are equal.
- `createMatch` / `previewCaptures` receive `startingPlayer`. The Player-A deck prefill keeps using `handSize('A')`, recomputed from the chosen starter.

---

## 7. Comfort (`LocalMatch.vue`)

- **Undo** — keep `history: MatchState[]`; each move pushes the previous (immutable) state, the “Undo” button pops. Disabled when history is empty or the match is finished.
- **Replay same config** — remember the last `MatchConfig` (hands + size + rules + starter). “Play again” reuses it without returning to setup; a secondary “Edit config” button returns to setup.
- **Tie-break** — `decideWinner`: on equal owned-cell counts, compare the **sum of all four spikes of each player’s controlled stones**; still equal → `draw`.
- **Last move / near end** — `MatchState.lastMove` highlights the most recent stone; when exactly one empty cell remains, the status bar shows “Final move!”.

---

## 8. Rules page (`app/components/RulesComponent.vue`)

- **Fix the Elements section**: the engine applies **−1** to the attacker when the defender’s element is strong against it ([match.ts] `elementBonus`); the page currently says “no bonus” for a weak attacker. Correct the wording and add an example of the −1 case.
- **Add Same / Plus / Combo** sections with mini-diagrams matching the existing diagram style, noting they are **optional** (toggles in setup).
- **Update Setup** (starting-player choice; extra stone to the non-starter) and **End of the Game** (tie-break).

---

## 9. Testing (`tests/game/engine/`, Vitest)

The engine is pure → tested without UI via the existing Vitest setup (`npm run test:run`).

- `resolveCaptures`: basic capture; element ±1; Same (threshold 2, allied side counts); Plus; Combo (basic-only cascade, no Same/Plus re-trigger); disabled-rule skips.
- `previewCaptures` output equals the captures produced by `placeStone` for the same move.
- `handSize` / fairness: starter gets `floor`, non-starter gets `ceil`; even boards equal.
- `decideWinner`: tie-break by spike sum; true draw.
- Each `CaptureEvent` carries the correct `edge` and `elementDelta`.

---

## 10. File-level impact

- `app/game/engine/types.ts` — new `CaptureRules`, `Edge`, `CaptureEvent`; extend `MatchConfig` / `MatchState`.
- `app/game/engine/match.ts` — extract `resolveCaptures`, add `previewCaptures`, Same/Plus/Combo, `lastMove`, tie-break.
- `app/components/game/LocalMatch.vue` — setup toggles (rules + starter), undo history, replay-config, hand-size change.
- `app/components/game/GameBoard.vue` — hover preview, edge/element/type feedback, last-move & final-move UI.
- `app/components/game/GameStone.vue` — edge highlight / element badge hooks if needed.
- `app/components/RulesComponent.vue` (+ `app/assets/css/rules.css` if needed) — docs.
- `tests/game/engine/*.test.ts` — engine tests.
