<template>
  <div class="hcaptcha-widget">
    <VueHcaptcha
      ref="inner"
      :sitekey="config.public.hcaptchaSiteKey"
      theme="dark"
      @verify="onVerify"
      @expired="onExpiredOrError"
      @challenge-expired="onExpiredOrError"
      @error="onExpiredOrError"
      @closed="onExpiredOrError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'

defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', token: string): void
}>()

const config = useRuntimeConfig()
const inner = ref<InstanceType<typeof VueHcaptcha> | null>(null)

const onVerify = (token: string) => emit('update:modelValue', token)
const onExpiredOrError = () => emit('update:modelValue', '')

const reset = () => {
  inner.value?.reset()
  emit('update:modelValue', '')
}

defineExpose({ reset })
</script>

<style scoped>
.hcaptcha-widget {
  display: flex;
  justify-content: center;
  min-height: 78px;
}
</style>
