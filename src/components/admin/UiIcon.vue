<template>
  <svg
    class="ui-icon"
    :style="{ width: sizePx, height: sizePx }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="path"
  />
</template>

<script setup>
import { computed } from 'vue'
import { iconPath } from '../../utils/icons.js'

const props = defineProps({
  name: { type: String, default: 'folder' },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 1.85 }
})

const path = computed(() => iconPath(props.name))
const sizePx = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<style scoped>
.ui-icon {
  display: block;
  flex-shrink: 0;
}
</style>
