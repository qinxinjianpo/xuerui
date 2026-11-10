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
        <svg class="logo" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="navLogoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#6f9bf5" />
              <stop offset="1" stop-color="#3b6fd8" />
            </linearGradient>
            <mask id="navLogoMask">
              <rect width="48" height="48" fill="#000" />
              <circle cx="23" cy="25" r="9.2" fill="#fff" />
              <circle cx="27.6" cy="21" r="7.6" fill="#000" />
            </mask>
          </defs>
          <rect width="48" height="48" rx="14" fill="url(#navLogoGrad)" />
          <rect width="48" height="48" rx="14" fill="#fff" opacity=".95" mask="url(#navLogoMask)" />
          <circle cx="35.4" cy="13.6" r="1.7" fill="#fff" opacity=".85" />
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
            <span class="category-count">{{ (category.sites || []).length }}</span>
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
            ref="searchInputEl"
            type="text"
            v-model="searchQuery"
            :placeholder="searchEngines[selectedEngine].placeholder"
            class="search-input"
            @keyup.enter="handleSearch"
            @keyup.esc="searchQuery = ''"
          />
          <span class="search-kbd" aria-hidden="true"><kbd>/</kbd></span>
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
                  v-for="(site, siteIndex) in category.sites"
                  :key="site.id"
                  :href="site.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="site-card"
                  :style="{ '--i': siteIndex }"
                >
                  <div class="site-icon">
                    <span class="site-fallback" :style="{ background: fallbackColor(site.name) }">{{ fallbackLetter(site.name) }}</span>
                    <img
                      :src="site.icon"
                      :alt="site.name"
                      loading="lazy"
                      @load="handleImageLoad"
                      @error="handleImageError"
                    />
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
const searchInputEl = ref(null) // 搜索框引用，供快捷键聚焦
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

// 站点首字母占位色：同一站点每次打开颜色稳定
const fallbackLetter = (name) => (name || '?').trim().charAt(0).toUpperCase()

const fallbackColor = (name) => {
  const key = name || '?'
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 360
  return `linear-gradient(135deg, hsl(${hash}, 46%, 58%), hsl(${(hash + 24) % 360}, 50%, 44%))`
}

// 图标加载成功：收起底下的首字母占位块，只留干净的白底图标
const handleImageLoad = (event) => {
  event.target.closest('.site-icon')?.classList.add('icon-loaded')
}

// 图标加载失败：直接移除 img，露出底下的首字母占位块（不再临时拼 DOM）
const handleImageError = (event) => {
  event.target.remove()
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

// 「/」快速聚焦搜索框（输入框内不劫持）
const onGlobalKeydown = (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
  const el = e.target
  const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
  if (typing) return
  e.preventDefault()
  searchInputEl.value?.focus()
}

// 组件挂载时获取数据
onMounted(async () => {
  checkLockStatus() // 检查锁定状态
  window.addEventListener('keydown', onGlobalKeydown)
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
  window.removeEventListener('keydown', onGlobalKeydown)
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
  background: var(--bg);
  color: var(--ink-1);
}

/* ── 左侧边栏 ── */
.sidebar {
  width: 224px;
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--sidebar-top) 0%, var(--sidebar) 62%);
  color: var(--sidebar-text);
  border-right: 1px solid var(--sidebar-line);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--sidebar-line);
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.55);
}

.site-title {
  font-size: 16.5px;
  font-weight: 650;
  letter-spacing: 0.3px;
  margin: 0;
  color: #f4f7fb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 10px 14px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-nav::-webkit-scrollbar {
  display: none;
}

.nav-title {
  display: none;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  padding: 0 10px;
  border-radius: 9px;
  cursor: pointer;
  color: var(--sidebar-text);
  font-size: 13.5px;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.category-item:hover {
  background: var(--sidebar-hover);
  color: #e6edf7;
}

.category-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.category-item.active {
  background: var(--sidebar-active);
  color: #ffffff;
}

.category-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}

.category-item .category-icon {
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.92;
}

.category-item .category-name {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-item.active .category-name {
  font-weight: 600;
}

.category-count {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 999px;
  color: inherit;
  opacity: 0.45;
  background: rgba(255, 255, 255, 0.06);
  transition: opacity 0.16s ease, background-color 0.16s ease;
}

.category-item:hover .category-count {
  opacity: 0.7;
}

.category-item.active .category-count {
  opacity: 0.85;
  background: rgba(255, 255, 255, 0.14);
}

/* ── 侧边栏底部 ── */
.sidebar-footer {
  flex-shrink: 0;
  padding: 12px 10px 14px;
  border-top: 1px solid var(--sidebar-line);
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 10px;
  border-radius: 9px;
  color: var(--sidebar-text);
  font-size: 12.5px;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.github-link:hover {
  background: var(--sidebar-hover);
  color: #ffffff;
}

/* ── 主内容区 ── */
.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.search-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 26px;
  background: var(--surface-translucent);
  backdrop-filter: saturate(1.6) blur(14px);
  -webkit-backdrop-filter: saturate(1.6) blur(14px);
  border-bottom: 1px solid var(--line);
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 620px;
  margin: 0 auto;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.search-container:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.search-engine-selector {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 8px;
  border-right: 1px solid var(--line);
  border-radius: 12px 0 0 12px;
  flex-shrink: 0;
  transition: background-color 0.16s ease;
}

.search-engine-selector:hover {
  background: var(--surface-2);
}

.engine-logo {
  width: 19px;
  height: 19px;
  margin-right: 5px;
  object-fit: contain;
  pointer-events: none;
  border-radius: 4px;
}

.engine-caret {
  font-size: 9px;
  color: var(--ink-3);
  margin-right: 8px;
  pointer-events: none;
}

.engine-select {
  position: absolute;
  inset: 0;
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
  min-width: 0;
  height: 100%;
  padding: 0 44px 0 14px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink-1);
  font-size: 14.5px;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--ink-3);
}

.search-kbd {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
}

.search-kbd kbd {
  font-family: inherit;
  font-size: 11px;
  line-height: 1.5;
  color: var(--ink-3);
  padding: 0 6px;
  border-radius: 5px;
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  background: var(--surface-2);
}

.search-container:focus-within .search-kbd {
  opacity: 0;
}

/* 主题切换 */
.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
}

.theme-toggle-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  flex-shrink: 0;
}

/* ── 移动端抽屉 ── */
.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 264px;
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  box-shadow: -12px 0 40px -18px rgba(15, 23, 42, 0.4);
  z-index: 1001;
  transition: right 0.28s cubic-bezier(0.22, 0.7, 0.3, 1);
  overflow: hidden;
}

.mobile-menu.active {
  right: 0;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px;
  background: linear-gradient(180deg, var(--sidebar-top), var(--sidebar));
  color: #fff;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-menu-header h3 {
  margin: 0;
  font-size: 15.5px;
  font-weight: 600;
}

.header-github-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  cursor: pointer;
  /* 原图是深色剪影，压在深色抽屉头部需要反白才看得见 */
  filter: brightness(0) invert(1);
  opacity: 0.5;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.header-github-icon:hover {
  opacity: 1;
  transform: scale(1.06);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.mobile-category-list {
  list-style: none;
  flex: 1;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
}

.mobile-category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.16s ease;
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
}

.mobile-category-item.active .category-name {
  color: var(--accent);
  font-weight: 600;
}

.mobile-category-item .category-icon {
  width: 26px;
  height: 26px;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--surface-2);
  flex-shrink: 0;
}

.mobile-category-item .category-name {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink-1);
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.24s ease, visibility 0.24s ease;
}

.mobile-menu-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* ── 内容区 ── */
.content-area {
  flex: 1;
  padding: 26px 28px 76px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) transparent;
}

.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  color: var(--ink-2);
  font-size: 13.5px;
}

.loading-spinner {
  width: 26px;
  height: 26px;
  border: 2.5px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
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
  gap: 10px;
  min-height: 260px;
  color: var(--ink-2);
  font-size: 13.5px;
}

.filter-empty-icon {
  font-size: 30px;
  opacity: 0.7;
}

.filter-clear-btn {
  padding: 7px 18px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-1);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease;
}

.filter-clear-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.categories-container {
  max-width: 1320px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 34px;
  scroll-margin-top: 86px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 13px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.2px;
  color: var(--ink-1);
}

.category-title .category-icon {
  width: 27px;
  height: 27px;
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--accent-soft);
  flex-shrink: 0;
}

.category-title .category-name {
  flex: none;
  font-size: inherit;
  font-weight: inherit;
}

.cat-count {
  margin-left: 2px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
  white-space: nowrap;
}

/* ── 卡片栅格 ── */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(228px, 1fr));
  gap: 12px;
}

.site-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  transition:
    transform 0.2s cubic-bezier(0.2, 0.7, 0.3, 1),
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  animation: cardIn 0.34s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  animation-delay: calc(var(--i, 0) * 16ms);
}

.site-card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, var(--accent-soft), transparent 58%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.site-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: var(--card-shadow-hover);
}

.site-card:hover::after {
  opacity: 0.5;
}

.site-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.site-card:active {
  transform: translateY(-1px);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.site-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
}

.site-icon {
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.site-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  user-select: none;
  transition: opacity 0.18s ease;
}

.site-icon.icon-loaded .site-fallback {
  opacity: 0;
}

.site-icon img {
  position: relative;
  z-index: 1;
  width: 21px;
  height: 21px;
  object-fit: contain;
}

.site-info {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.site-name {
  margin: 0 0 2px;
  font-size: 13.8px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-description {
  margin: 0;
  font-size: 11.8px;
  line-height: 1.45;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 回到顶部 ── */
.back-top-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink-2);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all 0.22s ease;
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

/* ── 备案 ── */
.icp-footer {
  flex-shrink: 0;
  padding: 9px 20px;
  border-top: 1px solid var(--line);
  background: var(--surface);
  text-align: center;
  font-size: 12px;
}

.icp-footer a {
  color: var(--ink-3);
  text-decoration: none;
  transition: color 0.16s ease;
}

.icp-footer a:hover {
  color: var(--accent);
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .sites-grid {
    grid-template-columns: repeat(auto-fill, minmax(206px, 1fr));
  }
}

@media (max-width: 768px) {
  .nav-home {
    flex-direction: column;
    height: 100vh;
    height: 100svh;
    overflow: hidden;
  }

  .sidebar {
    display: none;
  }

  .main-content {
    flex: 1;
    height: 100vh;
    height: 100svh;
    overflow: hidden;
  }

  .search-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 10px 14px;
    gap: 8px;
  }

  .search-container {
    max-width: none;
    height: 42px;
    margin: 0;
  }

  .search-kbd {
    display: none;
  }

  .theme-toggle-btn,
  .mobile-menu-btn {
    width: 36px;
    height: 36px;
  }

  .content-area {
    padding: 14px 14px 72px;
    padding-top: 76px;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .category-section {
    margin-bottom: 26px;
    scroll-margin-top: 70px;
  }

  .sites-grid {
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
    gap: 9px;
  }

  .site-card {
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 11px 8px;
    border-radius: 12px;
    text-align: center;
  }

  .site-icon {
    width: 34px;
    height: 34px;
    margin: 0;
    border-radius: 9px;
  }

  .site-icon img {
    width: 19px;
    height: 19px;
  }

  .site-info {
    width: 100%;
  }

  .site-name {
    font-size: 12.5px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    word-break: break-word;
    line-height: 1.4;
  }

  .site-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    word-break: break-word;
    line-height: 1.38;
    font-size: 11px;
  }

  .category-title {
    font-size: 14.5px;
    margin-bottom: 11px;
  }

  .back-top-btn {
    right: 16px;
    bottom: 18px;
  }

  .icp-footer {
    padding: 8px 14px;
  }
}

@media (max-width: 360px) {
  .sites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-card {
    animation: none;
  }
  .site-card:hover {
    transform: none;
  }
}

</style>
