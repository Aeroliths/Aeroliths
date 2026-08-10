<template>
  <div class="legal-container">
    <h1 class="legal-title">{{ $t('legal.title') }}</h1>

    <section class="legal-section">
      <h2>{{ $t('legal.s1.title') }}</h2>
      <div class="legal-content">
        <p><strong>{{ $t('legal.s1.gameName') }}</strong> {{ SITE_INFO.name }}</p>
        <p><strong>{{ $t('legal.s1.developerStudio') }}</strong> {{ SITE_INFO.developer.name }}</p>
        <p><strong>{{ $t('legal.s1.legalStatus') }}</strong> {{ SITE_INFO.developer.status }}</p>
        <p><strong>{{ $t('legal.s1.contactSupport') }}</strong> <a :href="'mailto:' + SITE_INFO.support.email">{{ SITE_INFO.support.email }}</a></p>
        <p><strong>{{ $t('legal.s1.publicationDirector') }}</strong> {{ SITE_INFO.developer.director }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s2.title') }}</h2>
      <div class="legal-content">
        <p>{{ $t('legal.s2.intro') }}</p>
        <p><strong>{{ $t('legal.s2.hostingProvider') }}</strong> {{ SITE_INFO.hosting.provider }}</p>
        <p><strong>{{ $t('legal.s2.address') }}</strong> {{ SITE_INFO.hosting.address }}</p>
        <p><strong>{{ $t('legal.s2.website') }}</strong> <a :href="SITE_INFO.hosting.website" target="_blank" rel="noopener noreferrer">{{ SITE_INFO.hosting.website }}</a></p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s3.title') }}</h2>
      <div class="legal-content">
        <h3>{{ $t('legal.s3.ownershipTitle') }}</h3>
        <i18n-t keypath="legal.s3.ownershipIntro" tag="p" scope="global">
          <template #gameName><strong>{{ SITE_INFO.name }}</strong></template>
          <template #developer><strong>{{ SITE_INFO.developer.name }}</strong></template>
        </i18n-t>
        <ul>
          <li><strong>{{ $t('legal.s3.sourceCodeLabel') }}</strong> {{ $t('legal.s3.sourceCodeDesc') }}</li>
          <li><strong>{{ $t('legal.s3.visualAssetsLabel') }}</strong> {{ $t('legal.s3.visualAssetsDesc') }}</li>
          <li><strong>{{ $t('legal.s3.audioContentLabel') }}</strong> {{ $t('legal.s3.audioContentDesc') }}</li>
          <li><strong>{{ $t('legal.s3.gameMechanicsLabel') }}</strong> {{ $t('legal.s3.gameMechanicsDesc') }}</li>
          <li><strong>{{ $t('legal.s3.userInterfaceLabel') }}</strong> {{ $t('legal.s3.userInterfaceDesc') }}</li>
          <li><strong>{{ $t('legal.s3.brandingLabel') }}</strong> {{ $t('legal.s3.brandingDesc') }}</li>
        </ul>

        <h3>{{ $t('legal.s3.restrictionsTitle') }}</h3>
        <i18n-t keypath="legal.s3.restrictionsIntro" tag="p" scope="global">
          <template #developer><strong>{{ SITE_INFO.developer.name }}</strong></template>
        </i18n-t>
        <ul>
          <li>{{ $t('legal.s3.restriction1') }}</li>
          <li>{{ $t('legal.s3.restriction2') }}</li>
          <li>{{ $t('legal.s3.restriction3') }}</li>
          <li>{{ $t('legal.s3.restriction4') }}</li>
          <li>{{ $t('legal.s3.restriction5') }}</li>
          <li>{{ $t('legal.s3.restriction6') }}</li>
        </ul>

        <h3>{{ $t('legal.s3.inspirationTitle') }}</h3>
        <i18n-t keypath="legal.s3.inspirationP1" tag="p" scope="global">
          <template #gameName><strong>{{ SITE_INFO.name }}</strong></template>
        </i18n-t>

        <h4>{{ $t('legal.s3.disclaimersTitle') }}</h4>
        <ul>
          <li><strong>{{ $t('legal.s3.noAffiliationLabel') }}</strong> {{ $t('legal.s3.noAffiliationDesc') }}</li>
          <li><strong>{{ $t('legal.s3.fanProjectLabel') }}</strong> {{ $t('legal.s3.fanProjectDesc') }}</li>
          <li><strong>{{ $t('legal.s3.originalImplLabel') }}</strong> {{ $t('legal.s3.originalImplDesc') }}</li>
          <li><strong>{{ $t('legal.s3.respectIpLabel') }}</strong> {{ $t('legal.s3.respectIpDesc') }}</li>
        </ul>

        <h4>{{ $t('legal.s3.trademarkTitle') }}</h4>
        <p>{{ $t('legal.s3.trademarkP1') }}</p>
        <p>{{ $t('legal.s3.trademarkP2') }}</p>

        <h3>{{ $t('legal.s3.thirdPartyTitle') }}</h3>
        <p>{{ $t('legal.s3.thirdPartyIntro') }}</p>

        <h4>{{ $t('legal.s3.coreTechTitle') }}</h4>
        <ul>
          <li><strong>{{ $t('legal.s3.nuxtLabel') }}</strong> {{ $t('legal.s3.nuxtDesc') }}</li>
          <li><strong>{{ $t('legal.s3.vueLabel') }}</strong> {{ $t('legal.s3.vueDesc') }}</li>
          <li><strong>{{ $t('legal.s3.nuxtUiLabel') }}</strong> {{ $t('legal.s3.nuxtUiDesc') }}</li>
          <li><strong>{{ $t('legal.s3.typescriptLabel') }}</strong> {{ $t('legal.s3.typescriptDesc') }}</li>
        </ul>

        <h4>{{ $t('legal.s3.additionalDepsTitle') }}</h4>
        <p>{{ $t('legal.s3.additionalDepsP1') }}</p>

        <h3>{{ $t('legal.s3.ugcTitle') }}</h3>
        <p>{{ $t('legal.s3.ugcIntro') }}</p>
        <ul>
          <li>{{ $t('legal.s3.ugc1') }}</li>
          <li>{{ $t('legal.s3.ugc2') }}</li>
          <li>{{ $t('legal.s3.ugc3') }}</li>
          <li>{{ $t('legal.s3.ugc4') }}</li>
        </ul>

        <h3>{{ $t('legal.s3.dmcaTitle') }}</h3>
        <p>
          {{ $t('legal.s3.dmcaIntro') }}
          <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">{{ $t('legal.s3.discordServerLink') }}</a>
          {{ $t('legal.s3.dmcaIntroSuffix') }}
        </p>
        <ul>
          <li>{{ $t('legal.s3.dmca1') }}</li>
          <li>{{ $t('legal.s3.dmca2') }}</li>
          <li>{{ $t('legal.s3.dmca3') }}</li>
          <li>{{ $t('legal.s3.dmca4') }}</li>
          <li>{{ $t('legal.s3.dmca5') }}</li>
        </ul>
        <p>{{ $t('legal.s3.dmcaClosing') }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s4.title') }}</h2>
      <div class="legal-content">
        <p>{{ $t('legal.s4.p1') }}</p>
        <p>{{ $t('legal.s4.p2') }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s5.title') }}</h2>
      <div class="legal-content">
        <h3>{{ $t('legal.s5.collectTitle') }}</h3>
        <p>{{ $t('legal.s5.collectIntro') }}</p>
        <ul>
          <li><strong>{{ $t('legal.s5.accountInfoLabel') }}</strong> {{ $t('legal.s5.accountInfoDesc') }}</li>
          <li><strong>{{ $t('legal.s5.gameDataLabel') }}</strong> {{ $t('legal.s5.gameDataDesc') }}</li>
          <li><strong>{{ $t('legal.s5.technicalDataLabel') }}</strong> {{ $t('legal.s5.technicalDataDesc') }}</li>
          <li><strong>{{ $t('legal.s5.gameProgressLabel') }}</strong> {{ $t('legal.s5.gameProgressDesc') }}</li>
        </ul>

        <h3>{{ $t('legal.s5.useTitle') }}</h3>
        <p>{{ $t('legal.s5.useIntro') }}</p>
        <ul>
          <li>{{ $t('legal.s5.use1') }}</li>
          <li>{{ $t('legal.s5.use2') }}</li>
          <li>{{ $t('legal.s5.use3') }}</li>
          <li>{{ $t('legal.s5.use4') }}</li>
          <li>{{ $t('legal.s5.use5') }}</li>
          <li>{{ $t('legal.s5.use6') }}</li>
        </ul>

        <h3>{{ $t('legal.s5.securityTitle') }}</h3>
        <p>{{ $t('legal.s5.securityP1') }}</p>

        <h3>{{ $t('legal.s5.retentionTitle') }}</h3>
        <p>{{ $t('legal.s5.retentionP1') }}</p>
        <i18n-t keypath="legal.s5.devNoticeP1" tag="p" scope="global">
          <template #gameName><strong>{{ SITE_INFO.name }}</strong></template>
        </i18n-t>

        <h3>{{ $t('legal.s5.rightsTitle') }}</h3>
        <p>{{ $t('legal.s5.rightsIntro') }}</p>
        <ul>
          <li><strong>{{ $t('legal.s5.rightAccessLabel') }}</strong> {{ $t('legal.s5.rightAccessDesc') }}</li>
          <li><strong>{{ $t('legal.s5.rightRectificationLabel') }}</strong> {{ $t('legal.s5.rightRectificationDesc') }}</li>
          <li><strong>{{ $t('legal.s5.rightErasureLabel') }}</strong> {{ $t('legal.s5.rightErasureDesc') }}</li>
          <li><strong>{{ $t('legal.s5.rightPortabilityLabel') }}</strong> {{ $t('legal.s5.rightPortabilityDesc') }}</li>
          <li><strong>{{ $t('legal.s5.rightObjectLabel') }}</strong> {{ $t('legal.s5.rightObjectDesc') }}</li>
        </ul>
        <p>
          {{ $t('legal.s5.rightsClosing') }} <strong><a :href="'mailto:' + SITE_INFO.support.email">{{ SITE_INFO.support.email }}</a></strong>
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s6.title') }}</h2>
      <div class="legal-content">
        <p>
          {{ $t('legal.s6.intro1') }}
          <strong>{{ $t('legal.s6.intro2') }}</strong>
          {{ $t('legal.s6.intro3') }}
        </p>
        <ul>
          <li>
            <strong>{{ $t('legal.s6.authLabel') }}</strong> {{ $t('legal.s6.authDesc') }}
          </li>
          <li>
            <strong>{{ $t('legal.s6.audienceLabel') }}</strong> {{ $t('legal.s6.audienceDesc') }}
          </li>
          <li>
            <strong>{{ $t('legal.s6.uiStateLabel') }}</strong> {{ $t('legal.s6.uiStateDesc') }}
          </li>
          <li>
            <strong>{{ $t('legal.s6.hcaptchaLabel') }}</strong> {{ $t('legal.s6.hcaptchaDesc') }}
            <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer">hcaptcha.com/privacy</a>.
          </li>
        </ul>
        <p>
          {{ $t('legal.s6.closing1') }}
          <a :href="'mailto:' + SITE_INFO.support.email">{{ SITE_INFO.support.email }}</a>.
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s7.title') }}</h2>
      <div class="legal-content">
        <i18n-t keypath="legal.s7.p1" tag="p" scope="global">
          <template #gameName><strong>{{ SITE_INFO.name }}</strong></template>
          <template #developer><strong>{{ SITE_INFO.developer.name }}</strong></template>
        </i18n-t>
        <p>{{ $t('legal.s7.p2') }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s8.title') }}</h2>
      <div class="legal-content">
        <i18n-t keypath="legal.s8.intro" tag="p" scope="global">
          <template #gameName><strong>{{ SITE_INFO.name }}</strong></template>
        </i18n-t>

        <h3>{{ $t('legal.s8.prohibitedTitle') }}</h3>
        <p>{{ $t('legal.s8.prohibitedIntro') }}</p>

        <h4>{{ $t('legal.s8.securityTitle') }}</h4>
        <ul>
          <li><strong>{{ $t('legal.s8.hackingLabel') }}</strong> {{ $t('legal.s8.hackingDesc') }}</li>
          <li><strong>{{ $t('legal.s8.cheatingLabel') }}</strong> {{ $t('legal.s8.cheatingDesc') }}</li>
          <li><strong>{{ $t('legal.s8.automatedLabel') }}</strong> {{ $t('legal.s8.automatedDesc') }}</li>
          <li><strong>{{ $t('legal.s8.sharingLabel') }}</strong> {{ $t('legal.s8.sharingDesc') }}</li>
          <li><strong>{{ $t('legal.s8.bugLabel') }}</strong> {{ $t('legal.s8.bugDesc') }}</li>
        </ul>

        <h4>{{ $t('legal.s8.communityTitle') }}</h4>
        <ul>
          <li><strong>{{ $t('legal.s8.respectLabel') }}</strong> {{ $t('legal.s8.respectDesc') }}</li>
          <li><strong>{{ $t('legal.s8.contentLabel') }}</strong> {{ $t('legal.s8.contentDesc') }}</li>
          <li><strong>{{ $t('legal.s8.spamLabel') }}</strong> {{ $t('legal.s8.spamDesc') }}</li>
          <li><strong>{{ $t('legal.s8.fairPlayLabel') }}</strong> {{ $t('legal.s8.fairPlayDesc') }}</li>
          <li><strong>{{ $t('legal.s8.privacyLabel') }}</strong> {{ $t('legal.s8.privacyDesc') }}</li>
        </ul>

        <h4>{{ $t('legal.s8.legalTitle') }}</h4>
        <ul>
          <li><strong>{{ $t('legal.s8.ageLabel') }}</strong> {{ $t('legal.s8.ageDesc') }}</li>
          <li><strong>{{ $t('legal.s8.impersonationLabel') }}</strong> {{ $t('legal.s8.impersonationDesc') }}</li>
          <li><strong>{{ $t('legal.s8.ipLabel') }}</strong> {{ $t('legal.s8.ipDesc') }}</li>
          <li><strong>{{ $t('legal.s8.illegalLabel') }}</strong> {{ $t('legal.s8.illegalDesc') }}</li>
        </ul>

        <h3>{{ $t('legal.s8.reportingTitle') }}</h3>
        <p>
          {{ $t('legal.s8.reportingIntro') }}
          <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">{{ $t('legal.s3.discordServerLink') }}</a>.
          {{ $t('legal.s8.reportingSuffix') }}
        </p>

        <h3>{{ $t('legal.s8.consequencesTitle') }}</h3>
        <p>{{ $t('legal.s8.consequencesIntro') }}</p>
        <ul>
          <li><strong>{{ $t('legal.s8.warningLabel') }}</strong> {{ $t('legal.s8.warningDesc') }}</li>
          <li><strong>{{ $t('legal.s8.suspensionLabel') }}</strong> {{ $t('legal.s8.suspensionDesc') }}</li>
          <li><strong>{{ $t('legal.s8.banLabel') }}</strong> {{ $t('legal.s8.banDesc') }}</li>
          <li><strong>{{ $t('legal.s8.legalActionLabel') }}</strong> {{ $t('legal.s8.legalActionDesc') }}</li>
        </ul>

        <p>{{ $t('legal.s8.closing') }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s9.title') }}</h2>
      <div class="legal-content">
        <p>{{ $t('legal.s9.p1') }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>{{ $t('legal.s10.title') }}</h2>
      <div class="legal-content">
        <p>{{ $t('legal.s10.p1') }}</p>
        <p><strong>{{ $t('legal.s10.lastUpdatedLabel') }}</strong> {{ SITE_INFO.lastUpdated }}</p>
      </div>
    </section>

    <div class="legal-footer">
      <NuxtLinkLocale to="/" class="back-link">
        <span class="back-button">{{ $t('legal.backToHome') }}</span>
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'
</script>

<style scoped src="~/assets/css/legal.css"></style>
