<template>
  <!-- 锁定界面 -->
  <div v-if="isLocked && !isUnlocked" class="lock-container">
    <div class="lock-box">
      <h1>🔐 访问验证</h1>
      <p class="lock-description">此导航站已启用访问保护</p>
      <form @submit.prevent="handleUnlock">
        <div class="form-group">
          <label for="unlock-password">请输入访问密钥:</label>
          <input
            id="unlock-password"
            type="password"
            v-model="unlockPassword"
            placeholder="请输入访问密钥"
            required
            class="form-input"
          />
        </div>
        <button type="submit" class="unlock-btn" :disabled="unlocking">
          {{ unlocking ? '验证中...' : '进入导航' }}
        </button>
      </form>
      <div v-if="unlockError" class="error-message">
        {{ unlockError }}
      </div>
    </div>
  </div>

  <!-- 正常导航界面 -->
  <div v-else class="nav-home">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- Logo区域 -->
      <div class="logo-section">
        <svg class="logo" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub" role="img">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <h1 class="site-title">{{ title || 'Sherry 导航' }}</h1>
      </div>

      <!-- 分类导航 -->
      <nav class="category-nav">
                <ul class="category-list">
            <li
              v-for="category in categories"
              :key="category.id"
              class="category-item"
              :class="{ active: activeCategory === category.id }"
              role="button"
              tabindex="0"
              @click="scrollToCategory(category.id)"
              @keydown.enter.prevent="scrollToCategory(category.id)"
            >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </li>
        </ul>
      </nav>

      <!-- 左侧边栏底部信息 -->
      <div class="sidebar-footer">
        <a
          href="https://blog.sherry.dpdns.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="github-link"
          title="前往博客"
        >
          <span>🌙 愿逐月华流照君</span>
        </a>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
                  <!-- 顶部搜索栏 -->
      <header class="search-header">
        <div class="search-container">
          <div class="search-engine-selector">
            <img :src="searchEngines[selectedEngine].icon" :alt="selectedEngine" class="engine-logo" />
            <span class="engine-caret">▾</span>
            <select v-model="selectedEngine" class="engine-select" aria-label="选择搜索引擎">
              <option value="google">Google</option>
              <option value="baidu">Baidu</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
            </select>
          </div>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="searchEngines[selectedEngine].placeholder"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- 主题切换按钮 -->
        <button class="theme-toggle-btn" @click="themeStore.toggleTheme" :title="themeStore.isDarkMode ? '切换到日间模式' : '切换到夜间模式'">
          <svg v-if="!themeStore.isDarkMode" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
          </svg>
        </button>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu" aria-label="打开分类导航">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- 移动端分类菜单 -->
        <div class="mobile-menu" :class="{ active: showMobileMenu }">
          <div class="mobile-menu-header">
            <div class="header-left">
              <h3>分类导航</h3>
              <img :src="githubLogo" alt="GitHub" class="header-github-icon" @click="openGitHub" />
            </div>
            <button class="close-btn" @click="closeMobileMenu" aria-label="关闭菜单">×</button>
          </div>
                    <ul class="mobile-category-list">
              <li
                v-for="category in categories"
                :key="category.id"
                class="mobile-category-item"
                :class="{ active: activeCategory === category.id }"
                role="button"
                tabindex="0"
                @click="scrollToCategoryMobile(category.id)"
                @keydown.enter.prevent="scrollToCategoryMobile(category.id)"
              >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </li>
          </ul>
        </div>

        <!-- 移动端菜单遮罩 -->
        <div class="mobile-menu-overlay" :class="{ active: showMobileMenu }" @click="closeMobileMenu"></div>
      </header>

      <!-- 导航内容区 -->
      <div class="content-area">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="fetchCategories" class="retry-btn">重试</button>
        </div>

                <!-- 分类内容 -->
        <div v-else class="categories-container">
          <template v-if="filteredCategories.length">
            <section
              v-for="category in filteredCategories"
              :key="category.id"
              class="category-section"
              :id="`category-${category.id}`"
            >
              <h2 class="category-title">
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="cat-count">{{ category.sites.length }} 站</span>
              </h2>

              <div class="sites-grid">
                <a
                  v-for="site in category.sites"
                  :key="site.id"
                  :href="site.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="site-card"
                >
                  <div class="site-icon">
                    <img :src="site.icon" :alt="site.name" loading="lazy" @error="handleImageError" />
                  </div>
                  <div class="site-info">
                    <h3 class="site-name">{{ site.name }}</h3>
                    <p class="site-description">{{ site.description }}</p>
                  </div>
                </a>
              </div>
            </section>
          </template>

          <!-- 站内过滤空态 -->
          <div v-else class="filter-empty">
            <div class="filter-empty-icon">🔍</div>
            <p>没有找到与「{{ searchQuery }}」相关的站点</p>
            <button class="filter-clear-btn" @click="searchQuery = ''">清除过滤</button>
          </div>
        </div>
      </div>

      <!-- 回到顶部 -->
      <button
        class="back-top-btn"
        :class="{ show: showBackTop }"
        @click="scrollToTop"
        aria-label="回到顶部"
        title="回到顶部"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5L12 19M12 5L5.5 11.5M12 5L18.5 11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- 备案号默认显示在主内容底部，未配置时不占用空间 -->
      <footer v-if="icpNumber" class="icp-footer">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          {{ icpNumber }}
        </a>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNavigation } from '@/apis/useNavigation.js'
import { useThemeStore } from '@/stores/counter.js'
// 导入搜索引擎logo图片
import googleLogo from '@/assets/goolge.png'
import baiduLogo from '@/assets/baidu.png'
import bingLogo from '@/assets/bing.png'
import duckLogo from '@/assets/duck.png'
// 导入GitHub logo
import githubLogo from '@/assets/github.png'

// 使用导航API
const { categories, title, icpNumber, defaultSearchEngine, loading, error, fetchCategories } = useNavigation()

// 使用主题store
const themeStore = useThemeStore()

// 响应式数据
const searchQuery = ref('') // 搜索查询
const selectedEngine = ref('bing') // 选中的搜索引擎，初始值会在组件挂载后更新
const showMobileMenu = ref(false) // 移动端菜单显示状态
const showBackTop = ref(false) // 回到顶部按钮显示状态

// 当前高亮分类（滚动联动）
const activeCategory = ref('')

// 站内快速过滤：有输入时先在本地按名称/描述/网址匹配；
// 过滤后各分类只显示命中的站点，全部无命中时展示空态
const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value
    .map((cat) => ({
      ...cat,
      sites: (cat.sites || []).filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.url || '').toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.sites.length > 0)
})

// 锁定功能相关
const isLocked = ref(false) // 是否启用锁定功能
const isUnlocked = ref(false) // 是否已解锁
const unlockPassword = ref('') // 解锁密码输入
const unlocking = ref(false) // 解锁中状态
const unlockError = ref('') // 解锁错误信息

// 搜索引擎配置
const searchEngines = {
  google: {
    url: 'https://www.google.com/search?q=',
    icon: googleLogo,
    placeholder: 'Google 搜索'
  },
  baidu: {
    url: 'https://www.baidu.com/s?wd=',
    icon: baiduLogo,
    placeholder: '百度一下'
  },
  bing: {
    url: 'https://www.bing.com/search?q=',
    icon: bingLogo,
    placeholder: 'Bing 搜索'
  },
  duckduckgo: {
    url: 'https://duckduckgo.com/?q=',
    icon: duckLogo,
    placeholder: 'DuckDuckGo 搜索'
  }
}

// 自定义固定时间滚动函数
const smoothScrollTo = (container, targetTop, duration = 600) => {
  const startTop = container.scrollTop
  const distance = targetTop - startTop
  let startTime = null

  const animateScroll = (currentTime) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)

    // 使用缓动函数 (easeInOutCubic)
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    container.scrollTop = startTop + distance * ease

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)
}

// 滚动到指定分类
const scrollToCategory = (categoryId) => {
  const element = document.getElementById(`category-${categoryId}`)
  const container = document.querySelector('.content-area')

  if (element && container) {
    // 检查是否为移动端
    const isMobile = window.innerWidth <= 768

    let targetTop = 0

    if (isMobile) {
      // 移动端：在 content-area 容器内滚动，搜索栏高度运行时实测，避免硬编码失准
      const elementOffsetTop = element.offsetTop
      const searchHeaderHeight = document.querySelector('.search-header')?.offsetHeight || 80
      targetTop = elementOffsetTop - searchHeaderHeight
    } else {
      // 桌面端：在容器内滚动
      const searchHeader = document.querySelector('.search-header')
      const elementOffsetTop = element.offsetTop
      const searchHeaderHeight = searchHeader ? searchHeader.offsetHeight + 20 : 100
      targetTop = elementOffsetTop - searchHeaderHeight
    }

    // 使用固定时间滚动（600毫秒）
    smoothScrollTo(container, Math.max(0, targetTop), 600)
  }
}

// 检查是否启用锁定功能
const checkLockStatus = () => {
  const openLock = import.meta.env.VITE_OPEN_LOCK
  if (openLock && openLock.trim() !== '') {
    isLocked.value = true
    // 检查是否已经解锁过
    const savedUnlock = localStorage.getItem('nav_unlocked')
    if (savedUnlock === 'true') {
      isUnlocked.value = true
    }
  } else {
    isLocked.value = false
    isUnlocked.value = true // 如果没有启用锁定，默认为解锁状态
  }
}

// 处理解锁（通过服务端验证）
const handleUnlock = async () => {
  unlocking.value = true
  unlockError.value = ''

  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: unlockPassword.value }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || '访问密钥错误，请重新输入')
    }

    isUnlocked.value = true
    localStorage.setItem('nav_unlocked', 'true')
    unlockPassword.value = ''
  } catch (error) {
    unlockError.value = error.message
  } finally {
    unlocking.value = false
  }
}

// 处理搜索：本地有匹配站点时回车直达第一个命中站点，否则回退外部搜索引擎
const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return

  const first = filteredCategories.value[0]?.sites?.[0]
  if (first) {
    window.open(first.url, '_blank')
    return
  }

  const engine = searchEngines[selectedEngine.value]
  const url = engine.url + encodeURIComponent(q)
  window.open(url, '_blank')
}

// 处理图片加载错误：渲染"首字母彩色占位块"，避免回退成站点自身图标造成误导
const handleImageError = (event) => {
  const img = event.target
  const name = img.alt || '?'
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360

  const box = document.createElement('span')
  box.textContent = name.charAt(0).toUpperCase()
  box.style.cssText =
    'display:flex;width:100%;height:100%;align-items:center;justify-content:center;' +
    'font-size:14px;font-weight:600;color:#fff;' +
    `background:hsl(${hue}, 60%, 55%);border-radius:inherit;`

  img.replaceWith(box)
}

// 移动端菜单控制
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // 控制body滚动
  if (showMobileMenu.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  // 恢复body滚动
  document.body.style.overflow = ''
}

// 移动端分类滚动
const scrollToCategoryMobile = (categoryId) => {
  closeMobileMenu() // 先关闭菜单

  // 稍微延迟一下再滚动，确保菜单关闭动画完成
  setTimeout(() => {
    scrollToCategory(categoryId)
  }, 200)
}

// 打开GitHub项目页面（指向本项目仓库）
const openGitHub = () => {
  window.open('https://github.com/qinxinjianpo/xuerui', '_blank')
}

// 回到顶部
const scrollToTop = () => {
  const container = document.querySelector('.content-area')
  if (container) smoothScrollTo(container, 0, 500)
}

// 滚动联动：根据右侧内容区滚动位置高亮对应分类
const onContentScroll = () => {
  const container = document.querySelector('.content-area')
  if (!container) return

  // 滚动超过一屏后显示回到顶部按钮
  showBackTop.value = container.scrollTop > 400

  const containerTop = container.getBoundingClientRect().top
  const sections = container.querySelectorAll('.category-section')
  let current = activeCategory.value
  for (const sec of sections) {
    const top = sec.getBoundingClientRect().top - containerTop
    if (top <= 120) {
      current = sec.id.replace('category-', '')
    }
  }
  if (current) activeCategory.value = current
}

// 组件挂载时获取数据
onMounted(async () => {
  checkLockStatus() // 检查锁定状态
  await fetchCategories()
  // 设置默认搜索引擎
  selectedEngine.value = defaultSearchEngine.value
  // 初始化滚动联动高亮
  await nextTick()
  activeCategory.value = categories.value[0]?.id || ''
  const container = document.querySelector('.content-area')
  container?.addEventListener('scroll', onContentScroll, { passive: true })
  onContentScroll()
})

// 组件卸载时清理样式
onUnmounted(() => {
  // 确保卸载时恢复body滚动
  document.body.style.overflow = ''
  // 移除滚动监听，避免内存泄漏
  const container = document.querySelector('.content-area')
  container?.removeEventListener('scroll', onContentScroll)
})
</script>

<style scoped>
/* 锁定界面样式（独立场景，保留亮暗两套显式配色） */
.lock-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2c3e50;
  padding: 20px;
  z-index: 9999;
}

.lock-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.lock-box h1 {
  color: #2d3748;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.lock-description {
  color: #718096;
  margin-bottom: 30px;
  font-size: 16px;
}

.lock-box .form-group {
  margin-bottom: 20px;
  text-align: left;
}

.lock-box .form-group label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-weight: 500;
  font-size: 14px;
}

.lock-box .form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #fff;
}

.lock-box .form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.unlock-btn {
  width: 100%;
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.unlock-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.unlock-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.lock-box .error-message {
  margin-top: 15px;
  padding: 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #feb2b2;
}

.dark .lock-container {
  background: #0f172a;
}

.dark .lock-box {
  background: #1e293b;
  color: #e2e8f0;
}

.dark .lock-box h1 {
  color: #e2e8f0;
}

.dark .lock-description {
  color: #94a3b8;
}

.dark .lock-box .form-group label {
  color: #cbd5e1;
}

.dark .lock-box .form-input {
  background: var(--surface-2);
  border: 2px solid var(--line);
  color: #e2e8f0;
}

.dark .lock-box .form-input:focus {
  border-color: var(--accent);
}

.dark .lock-box .error-message {
  background: #7f1d1d;
  color: #fecaca;
  border-color: #991b1b;
}

/* ===== 导航主页 ===== */
.nav-home {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg);
}

/* 左侧边栏样式 */
.sidebar {
  width: 220px;
  background-color: var(--sidebar);
  color: white;
  padding: 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100vh;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-top: 13px;
  padding-bottom: 13px;
  border-bottom: 1px solid var(--sidebar-line);
}

.logo {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  margin-right: 15px;
}

.site-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.category-nav {
  padding: 16px 0;
  height: calc(100vh - 180px); /* 为底部留出空间 */
  overflow-y: auto;
  scrollbar-width: none; /* Firefox：隐藏滚动条 */
  -ms-overflow-style: none; /* 旧版 Edge：隐藏滚动条 */
}

/* Chrome / Safari / 新版 Edge：隐藏滚动条但保留滚动能力 */
.category-nav::-webkit-scrollbar {
  display: none;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 20px 15px;
  color: var(--sidebar-text);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.category-item:hover {
  background-color: var(--sidebar-hover);
  box-shadow: inset 4px 0 0 var(--accent);
}

.category-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  border-radius: 6px;
}

.category-item.active {
  background-color: var(--sidebar-active);
  box-shadow: inset 4px 0 0 var(--accent);
}

.category-item.active .category-name {
  color: #ffffff;
  font-weight: 600;
}

.category-item .category-icon {
  /* emoji 统一"装"进圆角小底板，跨平台观感一致 */
  width: 26px;
  height: 26px;
  font-size: 15px;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.category-name {
  font-size: 15px;
  font-weight: 500;
}

/* 左侧边栏底部 */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--sidebar-line);
  margin-top: auto;
}

.github-link {
  display: flex;
  align-items: center;
  color: var(--sidebar-text);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.github-link:hover {
  background: var(--sidebar-hover);
  color: white;
  transform: translateY(-1px);
}

/* 右侧主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.search-header {
  background: var(--surface);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-container {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--line);
  flex: 1;
}

@media (max-width: 768px) {
  .search-container {
    margin: 0;
    max-width: none;
  }
}

.search-engine-selector {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border-right: 1px solid var(--line);
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.search-engine-selector:hover {
  background: var(--surface-3);
}

.engine-logo {
  width: 24px;
  height: 24px;
  margin: 8px 4px 8px 8px;
  object-fit: contain;
  pointer-events: none;
  border-radius: 4px;
}

.engine-caret {
  font-size: 10px;
  color: var(--ink-2);
  margin-right: 6px;
  pointer-events: none;
}

.engine-select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  outline: none;
  background: transparent;
}

.search-input {
  flex: 1;
  border: none;
  padding: 12px 16px;
  font-size: 16px;
  outline: none;
  background: var(--surface);
  color: var(--ink-1);
  min-width: 0;
}

.search-input::placeholder {
  color: var(--ink-3);
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--ink-1);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.mobile-menu-btn:hover {
  background: var(--surface-2);
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 240px;
  height: 100vh;
  background: var(--surface);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  transition: right 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.mobile-menu.active {
  right: 0;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--line);
  background: var(--sidebar);
  color: white;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-github-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.header-github-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 40px;
}

.mobile-category-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--surface-2);
}

.mobile-category-item:hover {
  background: var(--surface-2);
}

.mobile-category-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.mobile-category-item.active {
  background: var(--accent-soft);
  box-shadow: inset 3px 0 0 var(--accent);
}

.mobile-category-item.active .category-name {
  color: var(--accent);
  font-weight: 600;
}

.mobile-category-item .category-icon {
  width: 28px;
  height: 28px;
  font-size: 16px;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: var(--surface-2);
  flex-shrink: 0;
}

.mobile-category-item .category-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-1);
}

/* 移动端菜单遮罩 */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.mobile-menu-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* 内容区域样式 */
.content-area {
  flex: 1;
  padding: 30px;
  padding-bottom: 80px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.35) transparent;
}

.content-area::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.35);
  border-radius: 3px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--ink-2);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--line);
  border-top: 4px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: var(--accent-hover);
}

/* 站内过滤空态 */
.filter-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: var(--ink-2);
  gap: 8px;
}

.filter-empty-icon {
  font-size: 40px;
}

.filter-clear-btn {
  margin-top: 6px;
  padding: 8px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.filter-clear-btn:hover {
  background: var(--accent-hover);
}

.categories-container {
  max-width: 1200px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 44px;
  scroll-margin-top: 90px;
}

.category-title {
  font-size: 21px;
  font-weight: 600;
  margin-bottom: 18px;
  color: var(--ink-1);
  display: flex;
  align-items: center;
}

.category-title .category-icon {
  font-size: 19px;
  margin-right: 10px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: var(--accent-soft);
  flex-shrink: 0;
}

.category-title .category-name {
  font-size: inherit;
}

.cat-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 1px 10px;
  border-radius: 999px;
  margin-left: 10px;
  white-space: nowrap;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.site-card {
  display: flex;
  align-items: center;
  background: var(--surface);
  border-radius: 12px;
  padding: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 1px solid var(--line);
  position: relative;
  overflow: hidden;
}

.site-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent);
}

.site-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  flex-shrink: 0;
  margin-right: 10px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.site-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.site-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 3px 0;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-description {
  font-size: 12px;
  color: var(--ink-2);
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 回到顶部按钮 */
.back-top-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-1);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all 0.25s ease;
  z-index: 400;
}

.back-top-btn.show {
  opacity: 1;
  visibility: visible;
  transform: none;
}

.back-top-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

/* 备案信息 */
.icp-footer {
  flex-shrink: 0;
  padding: 10px 20px;
  text-align: center;
  background: var(--surface);
  border-top: 1px solid var(--line);
  font-size: 13px;
}

.icp-footer a {
  color: var(--ink-2);
  text-decoration: none;
  transition: color 0.2s ease;
}

.icp-footer a:hover {
  color: var(--accent);
}

/* 主题切换按钮样式 */
.theme-toggle-btn {
  background: none;
  border: none;
  color: var(--ink-1);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.theme-toggle-btn:hover {
  background: var(--surface-2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-home {
    flex-direction: column;
    height: 100vh;
    height: 100svh; /* 使用动态视口高度 */
    overflow: hidden;
  }

  .sidebar {
    display: none; /* 在移动端隐藏左侧边栏 */
  }

  .main-content {
    flex: 1;
    height: 100vh;
    height: 100svh; /* 使用动态视口高度，更准确 */
    margin-left: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search-header {
    padding: 15px 20px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 500;
    background: var(--surface);
    box-shadow: var(--shadow-sm);
  }

  .content-area {
    flex: 1;
    padding: 20px 15px;
    padding-top: 100px; /* 为固定的搜索框留出空间 */
    padding-bottom: 80px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
  }

  .mobile-menu-btn {
    display: block; /* 在移动端显示菜单按钮 */
    flex-shrink: 0;
  }

  .sites-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .site-card {
    padding: 12px 8px;
    flex-direction: column;
    text-align: center;
    min-height: 118px;
  }

  .site-card .site-icon {
    margin-right: 0;
    margin-bottom: 8px;
  }

  /* 小屏卡片：标题单行截断、描述最多两行，避免折行拆字 */
  .site-card .site-name {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    word-break: break-all;
    line-height: 1.35;
    font-size: 14px;
  }

  .site-card .site-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    word-break: break-all;
    line-height: 1.35;
    font-size: 12px;
  }

  .category-title {
    font-size: 19px;
    margin-bottom: 16px;
  }

  .category-title .category-icon {
    font-size: 20px;
    margin-right: 8px;
  }

  .icp-footer {
    padding: 8px 15px;
    font-size: 12px;
  }

  .back-top-btn {
    right: 16px;
    bottom: 20px;
  }
}

/* 小屏手机：两列布局，卡片更从容 */
@media (max-width: 480px) {
  .sites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
