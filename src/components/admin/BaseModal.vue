<template>
  <div class="md-mask" @click.self="emit('close')">
    <div class="md-box" role="dialog" aria-modal="true" :aria-label="title">
      <header class="md-head">
        <h3>{{ title }}</h3>
        <button type="button" class="md-x" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <div class="md-body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="md-foot">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  title: { type: String, default: '' }
})
const emit = defineEmits(['close'])

// 弹窗挂在 body 外的层级，Esc 靠 window 监听才收得到
const onKeydown = (e) => {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.md-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--overlay);
  backdrop-filter: blur(2px);
}
.md-box {
  width: 100%;
  max-width: 430px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: var(--surface);
  box-shadow: 0 24px 60px -20px rgba(15, 23, 42, 0.4);
}
.md-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--line);
}
.md-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.1px;
  color: var(--ink-1);
}
.md-x {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition: color 0.14s ease, background-color 0.14s ease;
}
.md-x:hover {
  color: var(--ink-1);
  background: var(--surface-2);
}
.md-body {
  padding: 18px;
  overflow-y: auto;
}
.md-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 13px 18px 16px;
  border-top: 1px solid var(--line);
}

@keyframes md-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes md-box-in {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
.md-mask { animation: md-in 0.16s ease-out; }
.md-box { animation: md-box-in 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
@media (prefers-reduced-motion: reduce) {
  .md-mask, .md-box { animation: none; }
}
</style>
