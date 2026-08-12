<template>
  <div class="media-picker">
    <div class="media-picker-toolbar">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search images by name..."
      />
      <label class="btn-create media-picker-upload">
        Upload new image
        <input type="file" accept="image/*" @change="handleUpload" hidden />
      </label>
    </div>

    <div v-if="loading" class="loading">Loading images...</div>
    <div v-if="uploading" class="upload-loading">Uploading image...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="notice" class="success-message">{{ notice }}</div>

    <div v-if="!loading && filteredAssets.length > 0" class="media-grid">
      <button
        v-for="asset in filteredAssets"
        :key="asset.id"
        type="button"
        class="media-thumb"
        :class="{ selected: asset.id === modelValue }"
        :title="asset.label"
        @click="select(asset.id)"
      >
        <img :src="asset.path" :alt="asset.label" />
        <span class="media-thumb-label">{{ asset.label }}</span>
      </button>
    </div>

    <div v-if="!loading && assets.length === 0" class="no-data">
      No image in this library yet. Upload one to get started.
    </div>
    <div v-else-if="!loading && filteredAssets.length === 0" class="no-data">
      No image matches your search.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps<{
  category: 'lithos' | 'elements'
  modelValue: string
  initialPath?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const assets = ref<any[]>([])
const loading = ref(false)
const uploading = ref(false)
const error = ref('')
const notice = ref('')
const searchQuery = ref('')

const filteredAssets = computed(() => {
  if (!searchQuery.value) return assets.value
  const query = searchQuery.value.toLowerCase()
  return assets.value.filter((asset) => asset.label?.toLowerCase().includes(query))
})

const select = (id: string) => {
  emit('update:modelValue', id)
}

// On edit the parent only knows the sprite path, so the matching asset is
// resolved once the library is loaded and its id is pushed back up.
const preselectFromPath = () => {
  if (props.modelValue || !props.initialPath) return
  const match = assets.value.find((asset) => asset.path === props.initialPath)
  if (match) emit('update:modelValue', match.id)
}

const fetchAssets = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<any>('/api/admin/media', {
      query: { category: props.category },
    })
    assets.value = response.data
    preselectFromPath()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load the image library'
  } finally {
    loading.value = false
  }
}

const handleUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  error.value = ''
  notice.value = ''
  uploading.value = true

  const reader = new FileReader()
  reader.onload = async (loaded) => {
    try {
      const response = await $fetch<any>('/api/admin/media', {
        method: 'POST',
        body: {
          category: props.category,
          image: loaded.target?.result as string,
          label: file.name,
        },
      })

      notice.value = response.reused ? 'Image already in library, reused' : ''
      await fetchAssets()
      emit('update:modelValue', response.data.id)
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Failed to upload the image'
    } finally {
      uploading.value = false
      target.value = ''
    }
  }
  reader.readAsDataURL(file)
}

watch(() => props.category, fetchAssets)

onMounted(fetchAssets)
</script>
