<template>
  <div class="tab-content">
    <h2>News Management</h2>

    <div class="lithos-header">
      <button @click="openCreateModal" class="btn-create">Create New News</button>
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="Search news by title..." class="search-input" />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading news...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="!loading && filteredNews.length > 0" class="news-admin-list">
      <div v-for="item in filteredNews" :key="item.id" class="news-admin-card">
        <div class="news-admin-cover">
          <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title" />
          <div v-else class="news-admin-cover-placeholder">No cover</div>
        </div>
        <div class="news-admin-body">
          <div class="news-admin-header">
            <h3>{{ item.title }}</h3>
            <span :class="['news-admin-badge', item.published ? 'badge-published' : 'badge-draft']">
              {{ item.published ? 'Published' : 'Draft' }}
            </span>
          </div>
          <p class="news-admin-slug">/news/{{ item.slug }}</p>
          <p v-if="item.excerpt" class="news-admin-excerpt">{{ item.excerpt }}</p>
          <p class="news-admin-date">
            <template v-if="item.published && item.publishedAt">
              Published {{ formatDate(item.publishedAt) }}
            </template>
            <template v-else>
              Created {{ formatDate(item.createdAt) }}
            </template>
          </p>
          <div class="news-admin-actions">
            <button @click="openEditModal(item)" class="btn-edit" :disabled="actionLoading">Edit</button>
            <button @click="confirmDelete(item)" class="btn-delete" :disabled="actionLoading">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredNews.length === 0 && !searchQuery" class="no-data">No news yet.</div>
    <div v-if="!loading && filteredNews.length === 0 && searchQuery" class="no-data">No news match your search.</div>
  </div>

  <!-- Create/Edit modal -->
  <div v-if="showModal" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <h3>{{ form.id ? 'Edit News' : 'Create News' }}</h3>
      <form @submit.prevent="saveNews">
        <div class="form-group">
          <label for="news-title">Title</label>
          <input id="news-title" v-model="form.title" type="text" required maxlength="200" />
        </div>

        <div class="form-group">
          <label for="news-excerpt">Excerpt <span class="form-hint">optional, shown on the news list</span></label>
          <textarea
            id="news-excerpt"
            v-model="form.excerpt"
            rows="3"
            maxlength="300"
            placeholder="Short summary displayed on the public list..."
            class="form-textarea"
          />
        </div>

        <div class="form-group">
          <label for="news-cover">Cover image <span class="form-hint">optional</span></label>
          <input
            id="news-cover"
            type="file"
            accept="image/*"
            @change="handleCoverUpload"
            class="form-file"
          />
          <div v-if="form.coverImage" class="news-cover-preview">
            <img :src="form.coverImage" alt="Cover preview" />
            <button type="button" @click="removeCover" class="btn-remove-sprite">Remove cover</button>
          </div>
        </div>

        <div class="form-group">
          <label>Content</label>
          <NewsEditor v-model="form.content" />
        </div>

        <div class="form-group form-checkbox">
          <label class="checkbox-row">
            <input v-model="form.published" type="checkbox" class="checkbox-input" />
            <span class="checkbox-box" aria-hidden="true">
              <svg v-if="form.published" viewBox="0 0 16 16" width="12" height="12">
                <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="checkbox-text">
              <strong>Published</strong>
              <small>Visible on the public /news page</small>
            </span>
          </label>
        </div>

        <div v-if="modalError" class="error-message">{{ modalError }}</div>

        <div class="modal-actions">
          <button type="button" @click="closeModal" :disabled="modalLoading">Cancel</button>
          <button type="submit" :disabled="modalLoading">{{ modalLoading ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Confirmation modal -->
  <div v-if="showConfirmModal" class="modal-overlay" @click="cancelConfirm">
    <div class="modal modal-confirm" @click.stop>
      <h3>{{ confirmTitle }}</h3>
      <p>{{ confirmMessage }}</p>
      <div class="modal-actions">
        <button type="button" @click="cancelConfirm" :disabled="confirmLoading">Cancel</button>
        <button type="button" @click="confirmAction" :disabled="confirmLoading" class="btn-danger">
          {{ confirmLoading ? 'Processing...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import NewsEditor from '~/components/admin/NewsEditor.vue'

type NewsItem = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

const { initAuth } = useAuth()

const newsList = ref<NewsItem[]>([])
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const actionLoading = ref(false)

const filteredNews = computed(() => {
  if (!searchQuery.value) return newsList.value
  const q = searchQuery.value.toLowerCase()
  return newsList.value.filter((n) => n.title.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q))
})

const showModal = ref(false)
const modalLoading = ref(false)
const modalError = ref('')

const emptyForm = (): {
  id: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  coverChanged: boolean
  published: boolean
} => ({
  id: '',
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  coverChanged: false,
  published: false,
})

const form = ref(emptyForm())

const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmLoading = ref(false)
const confirmCallback = ref<(() => Promise<void>) | null>(null)

const formatDate = (iso: string | null) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const fetchNews = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: NewsItem[] }>('/api/admin/news')
    newsList.value = res.data || []
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to load news'
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  form.value = emptyForm()
  modalError.value = ''
  showModal.value = true
}

const openEditModal = (item: NewsItem) => {
  form.value = {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt || '',
    content: item.content || '',
    coverImage: item.coverImage || '',
    coverChanged: false,
    published: item.published,
  }
  modalError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  form.value = emptyForm()
  modalError.value = ''
}

const handleCoverUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  modalError.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.coverImage = e.target?.result as string
    form.value.coverChanged = true
  }
  reader.readAsDataURL(file)
}

const removeCover = () => {
  form.value.coverImage = ''
  form.value.coverChanged = true
  const input = document.getElementById('news-cover') as HTMLInputElement | null
  if (input) input.value = ''
}

const saveNews = async () => {
  modalLoading.value = true
  modalError.value = ''
  try {
    if (form.value.id) {
      const body: any = {
        title: form.value.title,
        excerpt: form.value.excerpt,
        content: form.value.content,
        published: form.value.published,
      }
      if (form.value.coverChanged) {
        body.coverImage = form.value.coverImage || null
      }
      await $fetch(`/api/admin/news/${form.value.id}`, { method: 'PATCH', body })
      successMessage.value = 'News updated successfully'
    } else {
      const body: any = {
        title: form.value.title,
        excerpt: form.value.excerpt,
        content: form.value.content,
        published: form.value.published,
      }
      if (form.value.coverImage) {
        body.coverImage = form.value.coverImage
      }
      await $fetch('/api/admin/news', { method: 'POST', body })
      successMessage.value = 'News created successfully'
    }
    closeModal()
    await fetchNews()
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error?.data?.statusMessage || 'Failed to save news'
  } finally {
    modalLoading.value = false
  }
}

const confirmDelete = (item: NewsItem) => {
  confirmTitle.value = 'Delete News'
  confirmMessage.value = `Are you sure you want to delete "${item.title}"? This action cannot be undone.`
  confirmCallback.value = async () => {
    actionLoading.value = true
    errorMessage.value = ''
    try {
      await $fetch(`/api/admin/news/${item.id}`, { method: 'DELETE' })
      successMessage.value = `News "${item.title}" deleted`
      await fetchNews()
      setTimeout(() => { successMessage.value = '' }, 3000)
    } catch (error: any) {
      errorMessage.value = error?.data?.statusMessage || 'Failed to delete news'
      throw error
    } finally {
      actionLoading.value = false
    }
  }
  showConfirmModal.value = true
}

const cancelConfirm = () => {
  showConfirmModal.value = false
  confirmCallback.value = null
  confirmLoading.value = false
}

const confirmAction = async () => {
  if (!confirmCallback.value) return
  confirmLoading.value = true
  try {
    await confirmCallback.value()
    showConfirmModal.value = false
    confirmCallback.value = null
  } catch {}
  finally {
    confirmLoading.value = false
  }
}

onMounted(async () => {
  await initAuth()
  await fetchNews()
})
</script>

<style scoped>
/* =========================================
   ADMIN NEWS LIST
   ========================================= */
.news-admin-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.news-admin-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  transition: all 0.25s ease;
}

.news-admin-card:hover {
  background: var(--bg-glass-light);
  border-color: var(--color-border-brand-light);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.news-admin-cover {
  aspect-ratio: 16 / 9;
  background: var(--color-bg-dark);
  overflow: hidden;
  position: relative;
}

.news-admin-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.news-admin-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-subtle);
  font-size: var(--font-sm);
  border: 1px dashed var(--color-border-lighter);
  background: var(--bg-glass-lighter);
}

.news-admin-body {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.news-admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.news-admin-header h3 {
  margin: 0;
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  line-height: 1.3;
}

.news-admin-badge {
  font-size: var(--font-xs);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  font-weight: var(--font-semibold);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.badge-published {
  background: var(--color-success-bg-alt);
  color: var(--color-success);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.badge-draft {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border: 1px solid var(--color-warning-border);
}

.news-admin-slug {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--color-text-subtle);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.news-admin-excerpt {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-admin-date {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-xs);
  color: var(--color-text-subtle);
}

.news-admin-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-lighter);
}

.news-admin-actions button {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-all);
}

.news-admin-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* =========================================
   MODAL OVERRIDES
   ========================================= */
.modal-large {
  max-width: 760px;
  width: 92vw;
}

/* =========================================
   FORM CONTROLS
   ========================================= */
.form-hint {
  font-size: var(--font-xs);
  color: var(--color-text-subtle);
  font-weight: var(--font-normal);
  margin-left: var(--spacing-xs);
}

.form-textarea {
  width: 100%;
  padding: 0.875rem var(--spacing-md);
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--font-sm);
  font-family: inherit;
  line-height: var(--line-height-normal);
  box-sizing: border-box;
  resize: vertical;
  transition: var(--transition-all);
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-info);
  background: var(--bg-glass-medium);
  box-shadow: var(--shadow-focus);
}

.form-textarea::placeholder {
  color: var(--color-text-placeholder);
}

.form-file {
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--bg-glass-light);
  border: 1px dashed var(--color-border-brand-light);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: var(--transition-all);
}

.form-file:hover {
  border-color: var(--color-border-brand);
  background: var(--bg-glass-medium);
}

.form-file::file-selector-button {
  margin-right: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--gradient-brand);
  color: var(--color-text-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

.form-file::file-selector-button:hover {
  opacity: 0.85;
}

/* =========================================
   COVER PREVIEW
   ========================================= */
.news-cover-preview {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.news-cover-preview img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

/* =========================================
   CHECKBOX (CUSTOM)
   ========================================= */
.form-checkbox {
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  margin-bottom: 0 !important;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  color: var(--color-bg-base);
  flex-shrink: 0;
  transition: var(--transition-all);
}

.checkbox-input:checked + .checkbox-box {
  background: var(--gradient-primary);
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(122, 184, 212, 0.15);
}

.checkbox-row:hover .checkbox-box {
  border-color: var(--color-border-brand);
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-text strong {
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--font-base);
}

.checkbox-text small {
  color: var(--color-text-muted);
  font-size: var(--font-xs);
}

@media (max-width: 768px) {
  .news-admin-list {
    grid-template-columns: 1fr;
  }
}
</style>
