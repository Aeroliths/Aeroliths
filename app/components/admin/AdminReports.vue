<template>
  <div class="tab-content">
    <h2>User Reports</h2>

    <div class="reports-filters">
      <button
        :class="{ active: statusFilter === 'pending' }"
        @click="statusFilter = 'pending'"
      >
        Pending<span v-if="pendingCount > 0" class="filter-badge">{{ pendingCount }}</span>
      </button>
      <button :class="{ active: statusFilter === 'resolved' }" @click="statusFilter = 'resolved'">
        Resolved
      </button>
      <button :class="{ active: statusFilter === 'dismissed' }" @click="statusFilter = 'dismissed'">
        Dismissed
      </button>
      <button :class="{ active: statusFilter === '' }" @click="statusFilter = ''">All</button>
    </div>

    <div v-if="loading" class="loading">Loading reports...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>

    <div v-if="!loading && filteredReports.length === 0" class="no-data">
      No reports to display.
    </div>

    <div v-if="!loading && filteredReports.length > 0" class="reports-list">
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="report-card"
        :class="`status-${report.status}`"
      >
        <div class="report-header">
          <span class="report-type-badge" :class="`type-${report.type}`">
            {{ report.type === 'profile_picture' ? 'Profile picture' : 'Username' }}
          </span>
          <span class="report-status-badge" :class="`status-${report.status}`">
            {{ report.status }}
          </span>
          <span class="report-date">{{ formatDate(report.createdAt) }}</span>
        </div>

        <div class="report-body">
          <div class="report-row">
            <span class="report-label">Reported user:</span>
            <div class="user-mini">
              <div class="user-avatar-mini">
                <img
                  v-if="report.reportedUser.profilePicture"
                  :src="report.reportedUser.profilePicture"
                  :alt="report.reportedUser.username"
                />
                <span v-else>{{ report.reportedUser.username.charAt(0) }}</span>
              </div>
              <div>
                <div>{{ report.reportedUser.username }}</div>
                <small>{{ report.reportedUser.email }}</small>
              </div>
            </div>
          </div>

          <div class="report-row">
            <span class="report-label">Reported by:</span>
            <span>{{ report.reporter.username }} ({{ report.reporter.email }})</span>
          </div>

          <div class="report-row">
            <span class="report-label">Reason:</span>
            <p v-if="report.reason" class="report-reason">{{ report.reason }}</p>
            <p v-else class="report-reason report-reason--empty">No reason provided</p>
          </div>
        </div>

        <div v-if="report.status === 'pending'" class="report-actions">
          <button
            class="btn-edit"
            :disabled="actionLoading === report.id"
            @click="updateReport(report, 'resolved', false)"
            title="Mark as resolved without modifying the user"
          >
            Resolve
          </button>
          <button
            class="btn-delete"
            :disabled="actionLoading === report.id"
            @click="confirmClearAndResolve(report)"
            :title="
              report.type === 'profile_picture'
                ? 'Resolve and remove the profile picture'
                : 'Resolve and reset the username'
            "
          >
            Resolve + clear {{ report.type === 'profile_picture' ? 'picture' : 'username' }}
          </button>
          <button
            class="btn-role"
            :disabled="actionLoading === report.id"
            @click="updateReport(report, 'dismissed', false)"
          >
            Dismiss
          </button>
        </div>

        <div v-else class="report-actions">
          <button
            class="btn-role"
            :disabled="actionLoading === report.id"
            @click="updateReport(report, 'pending', false)"
          >
            Reopen
          </button>
          <button
            class="btn-delete"
            :disabled="actionLoading === report.id"
            @click="deleteReport(report)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="confirmModal.open" class="modal-overlay" @click="cancelConfirm">
    <div class="modal modal-confirm" @click.stop>
      <h3>{{ confirmModal.title }}</h3>
      <p>{{ confirmModal.message }}</p>
      <div class="modal-actions">
        <button type="button" @click="cancelConfirm" :disabled="confirmModal.loading">Cancel</button>
        <button
          type="button"
          class="btn-danger"
          :disabled="confirmModal.loading"
          @click="confirmAction"
        >
          {{ confirmModal.loading ? 'Processing...' : 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const emit = defineEmits<{ (e: 'pending-count-changed', count: number): void }>()

const reports = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const statusFilter = ref<'pending' | 'resolved' | 'dismissed' | ''>('pending')
const actionLoading = ref<string | null>(null)

const confirmModal = ref<{
  open: boolean
  title: string
  message: string
  loading: boolean
  callback: (() => Promise<void>) | null
}>({ open: false, title: '', message: '', loading: false, callback: null })

const pendingCount = computed(() => reports.value.filter((r) => r.status === 'pending').length)

watch(pendingCount, (count) => emit('pending-count-changed', count))

const filteredReports = computed(() => {
  if (!statusFilter.value) return reports.value
  return reports.value.filter((r) => r.status === statusFilter.value)
})

const formatDate = (date: string) =>
  new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const showFlash = (msg: string, type: 'success' | 'error' = 'success') => {
  if (type === 'success') {
    success.value = msg
    setTimeout(() => (success.value = ''), 3000)
  } else {
    error.value = msg
    setTimeout(() => (error.value = ''), 4000)
  }
}

const fetchReports = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<any>('/api/admin/reports')
    reports.value = res.data.reports
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to load reports'
  } finally {
    loading.value = false
  }
}

const updateReport = async (
  report: any,
  status: 'resolved' | 'dismissed' | 'pending',
  clearOffendingField: boolean
) => {
  actionLoading.value = report.id
  try {
    await $fetch(`/api/admin/reports/${report.id}`, {
      method: 'PATCH',
      body: { status, clearOffendingField },
    })
    showFlash('Report updated')
    await fetchReports()
  } catch (e: any) {
    showFlash(e.data?.statusMessage || 'Failed to update report', 'error')
  } finally {
    actionLoading.value = null
  }
}

const confirmClearAndResolve = (report: any) => {
  const isPicture = report.type === 'profile_picture'
  confirmModal.value = {
    open: true,
    title: isPicture ? 'Remove profile picture' : 'Reset username',
    message: isPicture
      ? `This will permanently delete ${report.reportedUser.username}'s profile picture and mark the report as resolved.`
      : `This will reset ${report.reportedUser.username}'s username to a placeholder and mark the report as resolved.`,
    loading: false,
    callback: async () => {
      await updateReport(report, 'resolved', true)
    },
  }
}

const deleteReport = (report: any) => {
  confirmModal.value = {
    open: true,
    title: 'Delete report',
    message: 'Permanently delete this report from the database?',
    loading: false,
    callback: async () => {
      actionLoading.value = report.id
      try {
        await $fetch(`/api/admin/reports/${report.id}`, { method: 'DELETE' })
        showFlash('Report deleted')
        await fetchReports()
      } catch (e: any) {
        showFlash(e.data?.statusMessage || 'Failed to delete report', 'error')
      } finally {
        actionLoading.value = null
      }
    },
  }
}

const cancelConfirm = () => {
  confirmModal.value = { open: false, title: '', message: '', loading: false, callback: null }
}

const confirmAction = async () => {
  if (!confirmModal.value.callback) return
  confirmModal.value.loading = true
  try {
    await confirmModal.value.callback()
  } finally {
    cancelConfirm()
  }
}

onMounted(() => fetchReports())
</script>

<style scoped>
.reports-filters {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.reports-filters button {
  padding: 6px 14px;
  background: var(--bg-glass-medium);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-muted);
  border-radius: var(--radius-lg);
  font-size: var(--font-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.reports-filters button.active {
  background: var(--gradient-brand);
  color: var(--color-text-primary);
  border-color: transparent;
}

.filter-badge {
  background: var(--color-error);
  color: #fff;
  border-radius: 99px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.report-card {
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.report-card.status-pending {
  border-left: 3px solid var(--color-error);
}

.report-card.status-resolved {
  border-left: 3px solid var(--color-success);
  opacity: 0.85;
}

.report-card.status-dismissed {
  border-left: 3px solid var(--color-text-subtle);
  opacity: 0.75;
}

.report-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-sm);
}

.report-type-badge,
.report-status-badge {
  font-size: var(--font-xs);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.report-type-badge.type-profile_picture {
  background: rgba(124, 92, 255, 0.18);
  color: #c7b8ff;
}

.report-type-badge.type-username {
  background: rgba(255, 173, 71, 0.18);
  color: #ffc98a;
}

.report-status-badge.status-pending {
  background: var(--color-error-bg);
  color: var(--color-error-light);
}

.report-status-badge.status-resolved {
  background: var(--color-success-bg-alt);
  color: var(--color-success);
}

.report-status-badge.status-dismissed {
  background: var(--bg-glass-medium);
  color: var(--color-text-subtle);
}

.report-date {
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: var(--font-xs);
}

.report-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.report-row {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  font-size: var(--font-sm);
}

.report-label {
  color: var(--color-text-subtle);
  min-width: 110px;
}

.user-mini {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
  font-weight: var(--font-bold);
  font-size: var(--font-xs);
}

.user-avatar-mini img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-mini small {
  color: var(--color-text-subtle);
  font-size: var(--font-xs);
}

.report-reason {
  margin: 0;
  padding: var(--spacing-sm);
  background: var(--bg-glass-medium);
  border-radius: var(--radius-md);
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.report-reason--empty {
  color: var(--color-text-subtle);
  font-style: italic;
}

.report-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.report-actions button {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

.report-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-danger {
  background: var(--color-error);
  color: #fff;
}
</style>
