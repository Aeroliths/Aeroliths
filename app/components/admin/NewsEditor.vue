<template>
  <div class="news-editor">
    <div v-if="editor" class="news-editor-toolbar">
      <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Italic">
        <em>I</em>
      </button>
      <button type="button" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Strikethrough">
        <s>S</s>
      </button>
      <span class="sep" />
      <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="Heading 2">
        H2
      </button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="Heading 3">
        H3
      </button>
      <span class="sep" />
      <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Bullet list">
        • List
      </button>
      <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Numbered list">
        1. List
      </button>
      <button type="button" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Quote">
        ❝
      </button>
      <span class="sep" />
      <button type="button" :class="{ active: editor.isActive('link') }" @click="promptLink" title="Link">
        🔗
      </button>
      <button type="button" @click="triggerImageUpload" title="Image" :disabled="uploadingImage">
        {{ uploadingImage ? '…' : '🖼️' }}
      </button>
      <input ref="imageInput" type="file" accept="image/*" hidden @change="handleImageUpload" />
      <span class="sep" />
      <button type="button" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="Undo">↶</button>
      <button type="button" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="Redo">↷</button>
    </div>

    <EditorContent :editor="editor" class="news-editor-content" />

    <p v-if="uploadError" class="news-editor-error">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const imageInput = ref<HTMLInputElement | null>(null)
const uploadingImage = ref(false)
const uploadError = ref('')

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Image.configure({ inline: false }),
    Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }),
  ],
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val || '', { emitUpdate: false })
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const promptLink = () => {
  if (!editor.value) return
  const previous = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previous || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const triggerImageUpload = () => {
  uploadError.value = ''
  imageInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !editor.value) return

  uploadError.value = ''
  uploadingImage.value = true
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

    const res = await $fetch<{ success: boolean; url: string }>('/api/admin/news/upload-image', {
      method: 'POST',
      body: { image: base64 },
    })

    if (res?.url) {
      editor.value.chain().focus().setImage({ src: res.url }).run()
    }
  } catch (err: any) {
    uploadError.value = err?.data?.statusMessage || 'Failed to upload image'
  } finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}
</script>

<style scoped>
.news-editor {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-glass-light);
  transition: var(--transition-all);
}

.news-editor:focus-within {
  border-color: var(--color-info);
  box-shadow: var(--shadow-focus);
}

.news-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--bg-glass-medium);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.news-editor-toolbar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  height: 30px;
  min-width: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.news-editor-toolbar button:hover:not(:disabled) {
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
}

.news-editor-toolbar button.active {
  background: rgba(122, 184, 212, 0.15);
  border-color: var(--color-border-brand-light);
  color: var(--color-brand-primary);
}

.news-editor-toolbar button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.news-editor-toolbar .sep {
  width: 1px;
  background: var(--color-border-light);
  margin: 0 4px;
}

.news-editor-content {
  padding: var(--spacing-md);
  min-height: 280px;
  max-height: 500px;
  overflow-y: auto;
}

.news-editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 260px;
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  font-size: var(--font-base);
}

.news-editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: 'Write your news content…';
  color: var(--color-text-placeholder);
  pointer-events: none;
  float: left;
  height: 0;
}

.news-editor-content :deep(h2) {
  font-size: var(--font-3xl);
  font-weight: var(--font-semibold);
  color: var(--color-brand-primary);
  margin: 1em 0 0.4em;
}

.news-editor-content :deep(h3) {
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 1em 0 0.4em;
}

.news-editor-content :deep(p) {
  margin: 0 0 0.6em;
}

.news-editor-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  margin: var(--spacing-sm) 0;
}

.news-editor-content :deep(blockquote) {
  border-left: 3px solid var(--color-border-brand);
  padding: 4px var(--spacing-md);
  margin: var(--spacing-sm) 0;
  color: var(--color-text-muted);
  background: var(--bg-glass-lighter);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.news-editor-content :deep(ul),
.news-editor-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 0.6em;
}

.news-editor-content :deep(li) {
  margin-bottom: 2px;
}

.news-editor-content :deep(a) {
  color: var(--color-brand-primary);
  text-decoration: underline;
}

.news-editor-content :deep(strong) {
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
}

.news-editor-content :deep(code) {
  background: var(--bg-glass-medium);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.92em;
  color: var(--color-brand-primary-light);
}

.news-editor-error {
  margin: 0;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-error-bg);
  border-top: 1px solid var(--color-error-border);
  color: var(--color-error-light);
  font-size: var(--font-sm);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
</style>
