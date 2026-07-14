<template>
  <div class="rules-page">
    <div class="rules-container">
      <h1>{{ $t('rules.title') }}</h1>
      <div class="rules-content">

        <section>
          <h2>{{ $t('rules.overview.title') }}</h2>
          <p>
            {{ $t('rules.overview.p1') }}
          </p>
        </section>

        <section>
          <h2>{{ $t('rules.setup.title') }}</h2>
          <ul>
            <li>{{ $t('rules.setup.boardSize') }}</li>
            <li>{{ $t('rules.setup.fillHand') }}</li>
            <li>{{ $t('rules.setup.firstPlayer') }}</li>
            <li>{{ $t('rules.setup.extraLitho') }}</li>
            <li>{{ $t('rules.setup.handModes') }}</li>
            <li>{{ $t('rules.setup.turnTimer') }}</li>
            <li>{{ $t('rules.setup.turnOrder') }}</li>
          </ul>
        </section>

        <section>
          <h2>{{ $t('rules.lithos.title') }}</h2>
          <p>
            {{ $t('rules.lithos.p1') }}
          </p>
          <div class="litho-diagram">
            <div class="litho-card">
              <span class="litho-value top">3</span>
              <span class="litho-value right">5</span>
              <span class="litho-value bottom">2</span>
              <span class="litho-value left">4</span>
              <span class="litho-center">{{ $t('rules.lithos.diagramLabel') }}</span>
            </div>
          </div>
          <p>
            {{ $t('rules.lithos.p2') }}
          </p>
        </section>

        <section>
          <h2>{{ $t('rules.placing.title') }}</h2>
          <p>
            {{ $t('rules.placing.p1') }}
          </p>
        </section>

        <section>
          <h2>{{ $t('rules.capture.title') }}</h2>
          <p>
            {{ $t('rules.capture.p1') }}
          </p>
          <ul>
            <li>{{ $t('rules.capture.greaterWins') }}</li>
            <li>{{ $t('rules.capture.lessOrEqualNothing') }}</li>
          </ul>
          <p>
            {{ $t('rules.capture.multiCapture') }}
          </p>
          <div class="capture-example">
            <div class="capture-row">
              <div class="mini-litho yours">
                <span class="mini-value right">7</span>
                <span class="mini-label">{{ $t('rules.capture.youLabel') }}</span>
              </div>
              <span class="capture-arrow">
                <span class="arrow-text">7 &gt; 3</span>
              </span>
              <div class="mini-litho opponent captured">
                <span class="mini-value left">3</span>
                <span class="mini-label">{{ $t('rules.capture.capturedLabel') }}</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>{{ $t('rules.elements.title') }}</h2>
          <p>
            {{ $t('rules.elements.p1') }}
          </p>
          <div class="element-cycle">
            <div class="element-item fire">{{ $t('rules.elements.fire') }}</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item wind">{{ $t('rules.elements.wind') }}</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item earth">{{ $t('rules.elements.earth') }}</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item water">{{ $t('rules.elements.water') }}</div>
            <span class="element-arrow">&rarr;</span>
            <div class="element-item fire">{{ $t('rules.elements.fire') }}</div>
          </div>
          <ul>
            <li>{{ $t('rules.elements.fireStrongVsWind') }}</li>
            <li>{{ $t('rules.elements.windStrongVsEarth') }}</li>
            <li>{{ $t('rules.elements.earthStrongVsWater') }}</li>
            <li>{{ $t('rules.elements.waterStrongVsFire') }}</li>
          </ul>
          <h3>{{ $t('rules.elements.howItWorksTitle') }}</h3>
          <p>
            {{ $t('rules.elements.howItWorksP1') }}
          </p>
          <div class="element-example">
            <p class="element-detail">
              {{ $t('rules.elements.example') }}
            </p>
          </div>
          <p>
            {{ $t('rules.elements.reverseP1') }}
          </p>
        </section>

        <section>
          <h2>{{ $t('rules.optionalRules.title') }}</h2>
          <p>
            {{ $t('rules.optionalRules.intro') }}
          </p>
          <ul>
            <li>
              {{ $t('rules.optionalRules.same') }}
            </li>
            <li>
              {{ $t('rules.optionalRules.plus') }}
            </li>
            <li>
              {{ $t('rules.optionalRules.combo') }}
            </li>
            <li>
              {{ $t('rules.optionalRules.elementalCells') }}
            </li>
            <li>
              {{ $t('rules.optionalRules.wall') }}
            </li>
          </ul>
        </section>

        <section>
          <h2>{{ $t('rules.handMatchRules.title') }}</h2>
          <ul>
            <li>
              {{ $t('rules.handMatchRules.openHands') }}
            </li>
            <li>
              {{ $t('rules.handMatchRules.order') }}
            </li>
            <li>
              {{ $t('rules.handMatchRules.chaos') }}
            </li>
            <li>
              {{ $t('rules.handMatchRules.suddenDeath') }}
            </li>
          </ul>
        </section>

        <section>
          <h2>{{ $t('rules.end.title') }}</h2>
          <p>
            {{ $t('rules.end.p1') }}
          </p>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped src="~/assets/css/rules.css"></style>
