import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import GameBoard from '~/components/game/GameBoard.vue'
import { createMatch } from '~/game/engine/match'
import type { Stone } from '~/game/engine/types'

function stone(id: string, value: number): Stone {
  return {
    id,
    name: `Stone ${id}`,
    elementId: null,
    spikeUp: value,
    spikeDown: value,
    spikeLeft: value,
    spikeRight: value,
  }
}

function board(selectedHandIndex: number | null = null) {
  return mount(GameBoard, {
    props: {
      state: createMatch({
        size: 3,
        hands: { A: [stone('a', 5), stone('b', 3)], B: [stone('c', 4)] },
        startingPlayer: 'A',
      }),
      selectedHandIndex,
    },
  })
}

describe('GameBoard accessibility', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('selects a hand stone from a plain click, so a keyboard can reach it', async () => {
    // A button activated by Enter fires click and no pointer event at all, so
    // a pointer-only handler leaves the game unplayable without a mouse.
    wrapper = board()

    await wrapper.findAll('.hand-card')[1]!.trigger('click')

    expect(wrapper.emitted('selectHand')?.at(-1)).toEqual([1])
  })

  it('does not select a stone the rules forbid', async () => {
    wrapper = mount(GameBoard, {
      props: {
        state: createMatch({
          size: 3,
          hands: { A: [stone('a', 5), stone('b', 3)], B: [] },
          startingPlayer: 'A',
          handRule: 'order',
        }),
        selectedHandIndex: null,
      },
    })

    await wrapper.findAll('.hand-card')[1]!.trigger('click')

    expect(wrapper.emitted('selectHand')).toBeUndefined()
  })

  it('names every cell rather than leaving a nameless button', async () => {
    wrapper = board(0)

    const cell = wrapper.find('.cell')
    expect(cell.attributes('aria-label')).toBeTruthy()
  })

  it('announces whose turn it is in a live region', async () => {
    wrapper = board()

    const live = wrapper.find('[aria-live]')
    expect(live.exists()).toBe(true)
    expect(live.text()).toContain('play.board.player1')
  })

  it('announces the result once the match is over', async () => {
    const finished = {
      ...createMatch({ size: 3, hands: { A: [], B: [] }, startingPlayer: 'A' }),
      status: 'finished' as const,
      winner: 'A' as const,
    }
    wrapper = mount(GameBoard, { props: { state: finished, selectedHandIndex: null } })

    expect(wrapper.find('[aria-live]').text()).toContain('play.board.player1')
  })
})
