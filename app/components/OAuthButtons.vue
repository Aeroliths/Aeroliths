<template>
  <div class="oauth-section">
    <div class="oauth-divider"><span>{{ $t('auth.oauth.orContinueWith') }}</span></div>
    <div class="oauth-buttons">
      <!-- Full-page navigation (OAuth requires a real redirect, not client routing) -->
      <a href="/auth/discord" class="oauth-button" :aria-label="$t('auth.oauth.continueWithDiscordAriaLabel')">
        <svg class="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#5865F2" d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.2 14.2 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.42 0-1.332.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.332.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z"/>
        </svg>
        <span>{{ $t('auth.oauth.discord') }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.oauth-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.oauth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-light);
}

.oauth-divider span {
  padding: 0 var(--spacing-md);
}

.oauth-buttons {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-sm);
}

.oauth-button {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 0.875rem var(--spacing-md);
  background: var(--bg-glass-medium);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--font-md);
  font-weight: var(--font-medium);
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition-all);
}

.oauth-button:hover {
  transform: translateY(-2px);
  background: var(--bg-glass-light);
  border-color: var(--color-border-subtle);
  box-shadow: var(--shadow-hover);
}

.oauth-button:active {
  transform: translateY(0);
}

.oauth-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .oauth-buttons {
    flex-direction: column;
  }
}
</style>
