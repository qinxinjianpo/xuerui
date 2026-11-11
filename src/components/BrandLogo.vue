<script setup>
import { ref, watch, useId } from 'vue'

const props = defineProps({
  src: { type: String, default: '' }
})

const broken = ref(false)
watch(
  () => props.src,
  () => {
    broken.value = false
  }
)

// 同一页面可能有多个实例，渐变 id 必须唯一
const uid = useId()
const bgId = `brand-bg-${uid}`
const ringId = `brand-ring-${uid}`
</script>

<template>
  <img v-if="src && !broken" :src="src" alt="" @error="broken = true" />
  <svg v-else viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <defs>
      <linearGradient :id="bgId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2c405e" />
        <stop offset="1" stop-color="#0a1220" />
      </linearGradient>
      <linearGradient :id="ringId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#eafaff" />
        <stop offset="1" stop-color="#3aa8e8" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="11" :fill="`url(#${bgId})`" />
    <circle
      cx="24"
      cy="24"
      r="13.6"
      fill="none"
      :stroke="`url(#${ringId})`"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-dasharray="74 12"
      transform="rotate(-32 24 24)"
    />
    <path d="M24 13.4l4.2 10.6h-8.4z" fill="#fff" />
    <path d="M24 34.6l4.2-10.6h-8.4z" fill="#2f7fb4" />
  </svg>
</template>
