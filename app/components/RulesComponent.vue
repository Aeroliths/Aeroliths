<template>
  <div class="rules-page">
    <div class="rules-container">
      <h1>Rules</h1>
      <div class="rules-content">

        <section>
          <h2>Overview</h2>
          <p>
            Aeroliths is a <strong>1v1 strategy board game</strong>. Two players face off
            on a board by placing stones called <strong>Lithos</strong>. The goal is to
            <strong>own more Lithos on the board</strong> than your opponent when the board is full.
          </p>
        </section>

        <section>
          <h2>Setup</h2>
          <ul>
            <li>The board size is chosen before the game starts (3x3, 4x4 or 5x5).</li>
            <li>Each player fills a hand of Lithos for the match.</li>
            <li>The first player is <strong>chosen or randomized</strong> in the setup screen.</li>
            <li>On odd boards the <strong>first</strong> player holds one extra Lithos, since they also make the last move.</li>
            <li>Hands can be filled manually, at <strong>random</strong>, <strong>mirrored</strong> (identical hands), or via an alternating <strong>draft</strong>.</li>
            <li>An optional <strong>turn timer</strong> can be enabled; running out plays a random move.</li>
            <li>Players then take turns placing one Lithos per turn on any empty cell.</li>
          </ul>
        </section>

        <section>
          <h2>The Lithos</h2>
          <p>
            Lithos are stones that each player places on the board. Every Lithos has
            <strong>4 values</strong>, one on each side: top, right, bottom and left. These values
            represent the power of the Lithos on that side.
          </p>
          <div class="litho-diagram">
            <div class="litho-card">
              <span class="litho-value top">3</span>
              <span class="litho-value right">5</span>
              <span class="litho-value bottom">2</span>
              <span class="litho-value left">4</span>
              <span class="litho-center">Lithos</span>
            </div>
          </div>
          <p>
            Each Lithos also belongs to an <strong>element</strong> (fire, water, earth, air...)
            which can give it an advantage or disadvantage during combat.
          </p>
        </section>

        <section>
          <h2>Placing a Lithos</h2>
          <p>
            On their turn, a player places one Lithos from their deck on any
            <strong>empty cell</strong> on the board. Once placed, the Lithos
            <strong>attacks all adjacent opponent Lithos</strong> (top, right, bottom, left).
          </p>
        </section>

        <section>
          <h2>Capture</h2>
          <p>
            When a Lithos is placed next to an opponent's Lithos, the touching sides
            are compared:
          </p>
          <ul>
            <li><strong>Your side value &gt; opponent's opposite side value</strong> - the opponent's Lithos is <strong>captured</strong> and becomes yours.</li>
            <li><strong>Your side value &le; opponent's opposite side value</strong> - nothing happens on that side.</li>
          </ul>
          <p>
            A single Lithos can capture <strong>multiple opponent Lithos at once</strong>
            if it is stronger on several sides.
          </p>
          <div class="capture-example">
            <div class="capture-row">
              <div class="mini-litho yours">
                <span class="mini-value right">7</span>
                <span class="mini-label">You</span>
              </div>
              <span class="capture-arrow">
                <span class="arrow-text">7 &gt; 3</span>
              </span>
              <div class="mini-litho opponent captured">
                <span class="mini-value left">3</span>
                <span class="mini-label">Captured!</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Elements</h2>
          <p>
            Each Lithos has an element. Elements interact with each other following
            a <strong>strengths and weaknesses</strong> cycle:
          </p>
          <div class="element-cycle">
            <div class="element-item fire">Fire</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item wind">Wind</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item earth">Earth</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item water">Water</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item fire">Fire</div>
          </div>
          <ul>
            <li><strong>Fire</strong> is strong against <strong>Wind</strong></li>
            <li><strong>Wind</strong> is strong against <strong>Earth</strong></li>
            <li><strong>Earth</strong> is strong against <strong>Water</strong></li>
            <li><strong>Water</strong> is strong against <strong>Fire</strong></li>
          </ul>
          <h3>How it works</h3>
          <p>
            When the element of the attacking Lithos is <strong>stronger</strong> than the
            element of the defending Lithos, the defending Lithos <strong>loses 1 point</strong>
            on the side being attacked. This bonus applies <strong>before</strong> the comparison.
          </p>
          <div class="element-example">
            <p class="element-detail">
              Your fire Lithos (right side = 5) attacks a wind Lithos (left side = 5).
              Fire is strong against wind, so the wind Lithos loses 1 point: 5 &rarr; 4.
              The comparison becomes 5 vs 4 &mdash; your Lithos wins and captures it.
            </p>
          </div>
          <p>
            Conversely, when the <strong>defending</strong> Lithos has the stronger
            element, the attacker <strong>loses 1 point</strong> on that side before the
            comparison. When the elements are equal (or neither is strong against the
            other), the raw values are compared directly.
          </p>
        </section>

        <section>
          <h2>Optional Rules</h2>
          <p>
            These rules can be toggled on in the match setup. They add depth to combat:
          </p>
          <ul>
            <li>
              <strong>Same</strong> &mdash; if your placed Lithos touches two or more Lithos
              whose facing value <strong>equals</strong> yours on that side (your own
              Lithos count toward the two), every <strong>opponent</strong> Lithos among
              those sides is captured, even without winning the comparison.
            </li>
            <li>
              <strong>Plus</strong> &mdash; if two or more sides share the <strong>same sum</strong>
              of your value plus the touching opponent value, those opponent Lithos are
              captured.
            </li>
            <li>
              <strong>Combo</strong> &mdash; any Lithos captured by Same or Plus immediately
              attacks its own neighbours with the normal comparison, which can chain into
              further captures.
            </li>
            <li>
              <strong>Elemental cells</strong> &mdash; some board cells carry an element.
              A Lithos placed on one gets <strong>+1</strong> to its values when its element
              matches the cell, <strong>&minus;1</strong> otherwise. This applies to Basic
              comparisons only (Same and Plus use raw values).
            </li>
            <li>
              <strong>Wall</strong> &mdash; the board edges count as a value-<strong>10</strong>
              neighbour for the Same and Plus rules (they are never captured). A side facing a
              wall counts for Same when your value there is 10, and adds 10 to that side's sum
              for Plus.
            </li>
          </ul>
        </section>

        <section>
          <h2>Hand &amp; Match Rules</h2>
          <ul>
            <li>
              <strong>Open hands</strong> &mdash; both hands are visible to both players
              throughout the match.
            </li>
            <li>
              <strong>Order</strong> &mdash; you must play your Lithos in order: only the
              leftmost Lithos in your hand can be placed each turn.
            </li>
            <li>
              <strong>Chaos</strong> &mdash; a random Lithos from your hand is chosen for you
              each turn; you only choose where to place it.
            </li>
            <li>
              <strong>Sudden Death</strong> &mdash; if the game ends in a draw, a new round
              starts with each player holding the Lithos they controlled at the end. The
              starting player alternates each round until someone wins.
            </li>
          </ul>
        </section>

        <section>
          <h2>End of the Game</h2>
          <p>
            The game ends when <strong>every cell on the board is filled</strong>.
            The player who <strong>owns the most Lithos</strong> wins. If both own the
            same number, the winner is the one whose controlled Lithos have the highest
            <strong>total side values</strong>; if those are equal too, the game is a
            <strong>draw</strong>.
          </p>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped src="~/assets/css/rules.css"></style>
