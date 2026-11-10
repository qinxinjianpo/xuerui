<template>
  <span class="fv" :class="{ loaded: ok }">
    <span class="fv-fallback" :style="{ background: bg }">{{ initial }}</span>
    <img v-if="src" :src="src" alt="" loading="lazy" @load="ok = true" @error="onError" />
  </span>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  url: { type: String, default: '' },
  icon: { type: String, default: '' },
  name: { type: String, default: '' }
})

const ok = ref(false)
const failed = ref(false)

// 优先用自定义图标；没填就用站点自己的 favicon
const src = computed(() => {
  if (props.icon) return props.icon
  if (failed.value || !props.url) return ''
  try {
    const u = new URL(props.url)
    return `${u.origin}/favicon.ico`
  } catch {
    return ''
  }
})

const initial = computed(() => {
  const n = (props.name || '').trim()
  if (!n) return '?'
  // 中文取首字，英文取首字母
  return /[\u4e00-\u9fa5]/.test(n[0]) ? n[0] : n[0].toUpperCase()
})

// 同名站点颜色要稳定，用名字算个色相
const bg = computed(() => {
  let h = 0
  for (const ch of props.name || '?') h = (h * 31 + ch.charCodeAt(0)) % 360
  return `linear-gradient(135deg, hsl(${h} 58% 56%), hsl(${(h + 26) % 360} 62% 46%))`
})

const onError = () => {
  failed.value = true
  ok.value = false
}

watch(() => [props.url, props.icon], () => {
  ok.value = false
  failed.value = false
})
</script>

<style scoped>
.fv {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-2);
}
.fv-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  user-select: none;
  transition: opacity 0.15s ease;
}
.fv.loaded .fv-fallback {
  opacity: 0;
}
.fv img {
  position: relative;
  z-index: 1;
  width: 17px;
  height: 17px;
  object-fit: contain;
}
</style>
