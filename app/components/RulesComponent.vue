<template>
  <div class="rules-page">
    <div class="rules-container">
      <h1>Rules</h1>
      <div class="rules-content">

        <section>
          <h2>The Board</h2>
          <p>
            The game takes place on a board with a variable size (e.g. 3x3, 4x4, 5x5...).
            Each cell on the board can hold one Lithos. The board starts empty and players
            take turns placing their Lithos on it.
          </p>
        </section>

        <section>
          <h2>The Lithos</h2>
          <p>
            Lithos are stones that each player places on the board. Every Lithos has
            4 values, one on each side: top, right, bottom and left. These values
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
            Each Lithos also has an element (fire, water, earth, air...) which can give it
            an advantage or disadvantage against opposing Lithos.
          </p>
        </section>

        <section>
          <h2>Placing a Lithos</h2>
          <p>
            On their turn, a player places one of their Lithos on any empty cell on the board.
            Once placed, its sides are compared to the adjacent opposing Lithos
            (top, right, bottom, left).
          </p>
        </section>

        <section>
          <h2>Capture</h2>
          <p>
            When a Lithos is placed next to an opponent's Lithos, the touching sides
            are compared. If the value of the placed Lithos on that side is <strong>higher</strong>
            than the opponent's value on the opposite side, the opponent's Lithos is captured
            and changes ownership.
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
            Each Lithos has an element. When the element of a Lithos is <strong>stronger</strong>
            than the element of the opposing Lithos, the opposing Lithos
            <strong>loses one point</strong> on the side being attacked. This makes it
            easier to capture.
          </p>
          <div class="element-example">
            <p class="element-detail">
              For example, if your fire Lithos (value 5 on the right) attacks a
              wind Lithos (value 5 on the left), the wind Lithos loses 1 point and drops to 4,
              so your Lithos captures it (5 &gt; 4).
            </p>
          </div>
        </section>

        <section>
          <h2>End of the Game</h2>
          <p>
            The game ends when <strong>every cell on the board is filled</strong>.
            The player who owns the most Lithos on the board wins.
          </p>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped src="~/assets/css/rules.css"></style>
