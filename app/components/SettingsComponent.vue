<template>
  <div class="settings-container">
    <div class="settings-card">
      <h1>{{ $t('settings.title') }}</h1>
      <SettingsProfile />
      <SettingsPassword />
      <SettingsAccountDeletion />
    </div>
  </div>
</template>

<style src="~/assets/css/settings.css"></style>
