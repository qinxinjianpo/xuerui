import { ref } from 'vue'
import { defineStore } from 'pinia'

/** 日间 / 夜间主题。页面里只用到 isDarkMode、toggleTheme，setTheme 留给以后扩展 */
export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false)

  const apply = () => {
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }

  const saved = localStorage.getItem('theme')
  isDarkMode.value = saved
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    apply()
  }

  // 模块初始化时同步一次，和 index.html 里的防闪色脚本保持一致
  apply()

  return { isDarkMode, toggleTheme }
})
