<template>
  <section class="rules-section">
    <h2 class="section-title">How to Play?</h2>

    <div class="rules-grid">
      <UCard class="rule-card">
        <template #header>
          <div class="card-header">
            <UIcon name="i-heroicons-squares-2x2" class="card-icon" />
            <h3>The Board</h3>
          </div>
        </template>
        <p>
          Face your opponent on a 3x3 grid. Each player strategically places
          their stones to conquer the enemy territory.
        </p>
        <div class="image-placeholder">
          <span class="placeholder-text">[Image - 3x3 Board]</span>
        </div>
      </UCard>

      <UCard class="rule-card">
        <template #header>
          <div class="card-header">
            <UIcon name="i-heroicons-cube" class="card-icon" />
            <h3>The Stones</h3>
          </div>
        </template>
        <p>
          Each stone has values on its 4 sides (top, bottom, left, right).
          The higher the value, the more powerful it is in that direction!
        </p>
        <div class="image-placeholder">
          <span class="placeholder-text">[Image - Stone with values example]</span>
        </div>
      </UCard>

      <UCard class="rule-card">
        <template #header>
          <div class="card-header">
            <UIcon name="i-heroicons-arrow-path" class="card-icon" />
            <h3>The Conquest</h3>
          </div>
        </template>
        <p>
          When you place a stone, compare its values with adjacent stones.
          If your value is higher, you capture the opponent's stone!
        </p>
        <div class="image-placeholder">
          <span class="placeholder-text">[Image - Capture example]</span>
        </div>
      </UCard>

      <UCard class="rule-card">
        <template #header>
          <div class="card-header">
            <UIcon name="i-heroicons-trophy" class="card-icon" />
            <h3>Victory</h3>
          </div>
        </template>
        <p>
          The player who controls the most stones at the end of the game wins.
          Strategy and anticipation are the keys to success!
        </p>
        <div class="image-placeholder">
          <span class="placeholder-text">[Image - Victory board]</span>
        </div>
      </UCard>
    </div>
  </section>
</template>
