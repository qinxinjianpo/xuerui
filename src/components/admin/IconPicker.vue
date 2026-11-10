<template>
  <div class="icon-picker">
    <div v-for="g in ICON_GROUPS" :key="g.name" class="ip-group">
      <p class="ip-group-name">{{ g.name }}</p>
      <div class="ip-grid">
        <button
          v-for="[key, label] in g.icons"
          :key="key"
          type="button"
          class="ip-cell"
          :class="{ on: modelValue === key }"
          :title="label"
          :aria-label="label"
          :aria-pressed="modelValue === key"
          @click="$emit('update:modelValue', key)"
        >
          <UiIcon :name="key" :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ICON_GROUPS } from '../../utils/icons.js'
import UiIcon from './UiIcon.vue'

defineProps({
  modelValue: { type: String, default: 'folder' }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ip-group-name {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--ink-3);
}
.ip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.ip-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.14s ease, border-color 0.14s ease, background-color 0.14s ease;
}
.ip-cell:hover {
  color: var(--ink-1);
  border-color: var(--border-strong);
  background: var(--surface-2);
}
.ip-cell.on {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}
.ip-cell:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

@media (max-width: 900px) {
  .ip-cell {
    width: 32px;
    height: 32px;
  }
}
</style>
