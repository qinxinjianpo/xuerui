<template>
  <!-- 全站访问保护（VITE_OPEN_LOCK 开启时） -->
  <div v-if="isLocked && !isUnlocked" class="lock-container">
    <div class="lock-box">
      <div class="lock-icon" v-html="iconSvg('lock')"></div>
      <h1>访问验证</h1>
      <p class="lock-description">此导航站已启用访问保护</p>
      <form @submit.prevent="handleUnlock">
        <input
          id="unlock-password"
          type="password"
          v-model="unlockPassword"
          placeholder="请输入访问密钥"
          required
          class="lock-input"
        />
        <button type="submit" class="unlock-btn" :disabled="unlocking">
          {{ unlocking ? '验证中…' : '进入导航' }}
        </button>
      </form>
      <div v-if="unlockError" class="error-message">{{ unlockError }}</div>
    </div>
  </div>

  <!-- 正常导航界面 -->
  <div v-else class="nav-home">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="logo-section">
        <BrandLogo :src="logo" class="logo" />
        <h1 class="site-title">{{ title || '导航' }}</h1>
      </div>

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
            <span class="cat-ico" v-html="iconSvg(category.icon)"></span>
            <span class="category-name">{{ category.name }}</span>
            <span v-if="category.private" class="cat-lock" :title="isVaultLocked(category) ? '已上锁' : '已解锁'" v-html="iconSvg('lock')"></span>
          </li>
        </ul>
      </nav>

      <!-- 每日一句：在线取，失败有兜底，不会留空 -->
      <div class="daily-quote" :class="{ 'is-loading': quoteLoading }">
        <button
          type="button"
          class="dq-refresh"
          :disabled="quoteLoading"
          title="换一句"
          aria-label="换一句"
          @click="loadQuote"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
            <path d="M20.5 4.5V10H15" />
          </svg>
        </button>
        <p class="dq-text">{{ quote.text }}</p>
        <p v-if="quote.from" class="dq-from">{{ quote.from }}</p>
      </div>

      <!-- 底部链接：文案与地址都可在后台改 -->
      <div class="sidebar-footer">
        <a
          v-if="footer.url"
          :href="footer.url"
          target="_blank"
          rel="noopener noreferrer"
          class="side-foot-link"
          :title="footer.text"
        >
          <span class="foot-ico" v-html="iconSvg('moon')"></span>
          <span class="foot-txt">{{ footer.text }}</span>
        </a>
        <span v-else class="side-foot-link is-plain">
          <span class="foot-ico" v-html="iconSvg('moon')"></span>
          <span class="foot-txt">{{ footer.text }}</span>
        </span>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
      <header class="search-header">
        <div class="head-wrap">
          <div class="m-brand mobile-only">
            <BrandLogo :src="logo" />
          </div>
          <div class="search-box">
          <span class="s-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="10.8" cy="10.8" r="6.6" />
              <path d="M15.6 15.6L20.4 20.4" />
            </svg>
          </span>

          <input
            ref="searchInputEl"
            type="text"
            v-model="searchQuery"
            :placeholder="currentEngine.placeholder"
            class="search-input"
            @keyup.enter="handleSearch"
            @keyup.esc="clearSearch"
          />

          <button v-if="searchQuery" type="button" class="s-clear" aria-label="清空" @click="clearSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M7 7l10 10M17 7L7 17" />
            </svg>
          </button>

          <!-- 搜索引擎：收成右侧一个下拉，不再平铺 -->
          <div class="engine-pick" ref="enginePickEl">
            <button
              type="button"
              class="eng-trigger"
              :class="{ open: engineOpen }"
              :aria-expanded="engineOpen"
              aria-haspopup="listbox"
              @click.stop="engineOpen = !engineOpen"
            >
              <span class="eng-label">{{ currentEngine.label }}</span>
              <svg class="eng-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <transition name="eng-pop">
              <div v-if="engineOpen" class="eng-menu" role="listbox">
                <button
                  v-for="e in engineList"
                  :key="e.key"
                  type="button"
                  class="eng-opt"
                  :class="{ on: selectedEngine === e.key }"
                  role="option"
                  :aria-selected="selectedEngine === e.key"
                  @click="pickEngine(e.key)"
                >
                  <span>{{ e.label }}</span>
                  <svg v-if="selectedEngine === e.key" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </button>
              </div>
            </transition>
          </div>

          <span v-if="!searchQuery" class="search-kbd" aria-hidden="true"><kbd>/</kbd></span>
        </div>

        <div class="head-right">
          <!-- 时间 / 日期 / 天气 -->
          <div class="clock">
            <div class="c-col">
              <span class="c-time">{{ clockTime }}</span>
              <span class="c-date">{{ clockDate }}</span>
            </div>
            <div v-if="weather" class="c-wx" :title="weatherTitle">
              <span class="c-wx-top">
                <span class="wx-ico" v-html="wxSvg"></span>
                <span class="c-temp">{{ weather.temp }}°</span>
              </span>
              <span class="c-city">{{ loc.name }} · {{ wxText }}</span>
            </div>
          </div>

          <button class="icon-btn" :title="themeStore.isDarkMode ? '切换到日间模式' : '切换到夜间模式'" @click="themeStore.toggleTheme">
            <svg v-if="!themeStore.isDarkMode" width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
            </svg>
            <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
            </svg>
          </button>

          <button class="icon-btn mobile-only" @click="toggleMobileMenu" aria-label="打开分类导航">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>
          </div>
        </div>

        <!-- 移动端分类抽屉 -->
        <div class="mobile-menu" :class="{ active: showMobileMenu }">
          <div class="mobile-menu-header">
            <div class="header-left">
              <h3>分类导航</h3>
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
              <span class="cat-ico" v-html="iconSvg(category.icon)"></span>
              <span class="category-name">{{ category.name }}</span>
              <span v-if="category.private" class="cat-lock" v-html="iconSvg('lock')"></span>
            </li>
          </ul>

          <!-- 手机端抽屉底部也放一句，不然这个功能在手机上完全看不到 -->
          <div class="daily-quote mobile-quote" :class="{ 'is-loading': quoteLoading }">
            <button
              type="button"
              class="dq-refresh"
              :disabled="quoteLoading"
              title="换一句"
              aria-label="换一句"
              @click="loadQuote"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
                <path d="M20.5 4.5V10H15" />
              </svg>
            </button>
            <p class="dq-text">{{ quote.text }}</p>
            <p v-if="quote.from" class="dq-from">{{ quote.from }}</p>
          </div>
        </div>
        <div class="mobile-menu-overlay" :class="{ active: showMobileMenu }" @click="closeMobileMenu"></div>
      </header>

      <div class="content-area">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中…</p>
        </div>

        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="fetchCategories" class="retry-btn">重试</button>
        </div>

        <div v-else class="categories-container">
          <template v-if="filteredCategories.length">
            <section
              v-for="category in filteredCategories"
              :key="category.id"
              class="category-section"
              :id="`category-${category.id}`"
            >
              <h2 class="category-title">
                <span class="cat-ico lg" v-html="iconSvg(category.icon)"></span>
                <span class="category-name">{{ category.name }}</span>
                <button
                  v-if="category.private && unlockedMap[category.id]"
                  type="button"
                  class="cat-relock"
                  title="立刻锁回去"
                  @click="relock(category)"
                >上锁</button>
              </h2>

              <!-- 上锁：整块只留一张入口卡，站点一个都不渲染 -->
              <div v-if="isVaultLocked(category)" class="vault">
                <button type="button" class="vault-btn" @click="openUnlock(category)">
                  <span class="vault-ico" v-html="iconSvg('lock')"></span>
                  <span class="vault-txt">
                    <strong>私密分类 · 已上锁</strong>
                    <em>{{ category.count ? `输入口令后显示 ${category.count} 个站点` : '输入口令后显示这里的站点' }}</em>
                  </span>
                  <span class="vault-go">输入口令</span>
                </button>
              </div>

              <div v-else-if="category.sites.length" class="sites-grid">
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
                      v-if="site.icon"
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

              <p v-else class="cat-empty">这个分类还没有站点</p>
            </section>
          </template>

          <div v-else class="filter-empty">
            <div class="filter-empty-icon" v-html="iconSvg('compass')"></div>
            <p>没有找到与「{{ searchQuery }}」相关的站点</p>
            <button class="filter-clear-btn" @click="clearSearch">清除过滤</button>
          </div>
        </div>
      </div>

      <button class="back-top-btn" :class="{ show: showBackTop }" @click="scrollToTop" aria-label="回到顶部" title="回到顶部">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19V5M12 5l-6.5 6.5M12 5l6.5 6.5" />
        </svg>
      </button>

      <footer v-if="icpNumber" class="icp-footer">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">{{ icpNumber }}</a>
      </footer>
    </main>

    <!-- 私密分类解锁弹窗 -->
    <div v-if="unlockTarget" class="vault-mask" @click.self="closeUnlock">
      <div class="vault-panel">
        <div class="vp-head">
          <span class="vp-ico" v-html="iconSvg('key')"></span>
          <div class="vp-title">
            <h3>{{ unlockTarget.name }}</h3>
            <p>输入这个分类的口令</p>
          </div>
          <button class="vp-close" @click="closeUnlock" aria-label="关闭">×</button>
        </div>

        <form @submit.prevent="doUnlock">
          <input
            ref="unlockInput"
            v-model="unlockPwd"
            type="password"
            class="vp-input"
            placeholder="口令"
            autocomplete="off"
            autofocus
          />
          <p v-if="unlockErr" class="vp-err">{{ unlockErr }}</p>
          <button type="submit" class="vp-submit" :disabled="unlocking || !unlockPwd">
            {{ unlocking ? '验证中…' : '解锁' }}
          </button>
        </form>

        <p class="vp-tip">口令只在本机校验，不上传；解锁仅在本次浏览有效</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNavigation } from '@/apis/useNavigation.js'
import BrandLogo from '@/components/BrandLogo.vue'
import { useThemeStore } from '@/stores/theme.js'
import { iconSvg } from '@/utils/icons.js'
import { fetchWeather, weatherIcon, weatherText, WEATHER_LOCATION } from '@/utils/weather.js'
import { fetchQuote, FALLBACK_QUOTE } from '@/utils/quote.js'
import { isSealed, openSealed } from '@/utils/secret.js'

const { categories, title, footer, icpNumber, logo, defaultSearchEngine, loading, error, fetchCategories } = useNavigation()

const themeStore = useThemeStore()

const loc = WEATHER_LOCATION

/* ── 搜索 ── */
const engineList = [
  { key: 'bing', label: 'Bing', url: 'https://www.bing.com/search?q=', placeholder: 'Bing 搜索' },
  { key: 'baidu', label: '百度', url: 'https://www.baidu.com/s?wd=', placeholder: '百度一下' }
]
const searchQuery = ref('')
const selectedEngine = ref('bing')
const searchInputEl = ref(null)
const engineOpen = ref(false)
const enginePickEl = ref(null)
const currentEngine = computed(
  () => engineList.find((e) => e.key === selectedEngine.value) || engineList[0]
)

const pickEngine = (key) => {
  selectedEngine.value = key
  engineOpen.value = false
  searchInputEl.value?.focus()
}

// 点空白处收起引擎下拉
const onDocClick = (e) => {
  if (!engineOpen.value) return
  if (enginePickEl.value && !enginePickEl.value.contains(e.target)) engineOpen.value = false
}

/* ── 每日一句（在线取，失败用兜底） ── */
const quote = ref({ text: FALLBACK_QUOTE.text, from: FALLBACK_QUOTE.from })
const quoteLoading = ref(false)
let quoteSeq = 0

const loadQuote = async () => {
  const seq = ++quoteSeq
  quoteLoading.value = true
  try {
    const q = await fetchQuote(quote.value.text)
    if (seq !== quoteSeq) return
    quote.value = { text: q.text, from: q.from }
  } finally {
    if (seq === quoteSeq) quoteLoading.value = false
  }
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value
    .map((cat) => {
      // 上锁的分类保留入口，否则一搜就消失
      if (isVaultLocked(cat)) return { ...cat }
      return {
        ...cat,
        sites: (cat.sites || []).filter(
          (s) =>
            (s.name || '').toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q) ||
            (s.url || '').toLowerCase().includes(q)
        )
      }
    })
    .filter((cat) => cat.sites.length > 0 || isVaultLocked(cat))
})

const clearSearch = () => {
  searchQuery.value = ''
}

const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return
  const first = filteredCategories.value.find((c) => !isVaultLocked(c))?.sites?.[0]
  if (first) {
    window.open(first.url, '_blank')
    return
  }
  window.open(currentEngine.value.url + encodeURIComponent(q), '_blank')
}

/* ── 时钟 ── */
const now = ref(new Date())
let clockTimer = null
const pad2 = (n) => String(n).padStart(2, '0')
const clockTime = computed(() => `${pad2(now.value.getHours())}:${pad2(now.value.getMinutes())}`)
const clockDate = computed(() => {
  const d = now.value
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 ${week}`
})

/* ── 天气（失败就只显示时间，不弹错误） ── */
const weather = ref(null)
let weatherTimer = null
const wxSvg = computed(() => (weather.value ? weatherIcon(weather.value.code, weather.value.isDay) : ''))
const wxText = computed(() => (weather.value ? weatherText(weather.value.code) : ''))
const weatherTitle = computed(() => {
  const w = weather.value
  if (!w) return ''
  return `${wxText.value} · ${w.low}° ~ ${w.high}° · 体感 ${w.feels}° · 湿度 ${w.humidity}% · 风速 ${w.wind} km/h`
})

const loadWeather = async () => {
  const data = await fetchWeather()
  if (data) weather.value = data
}

/* ── 私密分类 ── */
const unlockedMap = reactive({})
const unlockTarget = ref(null)
const unlockPwd = ref('')
const unlockErr = ref('')
const unlocking = ref(false)
const unlockInput = ref(null)

/** 有 private 标记、内容是密文、且本次还没解开 */
function isVaultLocked(cat) {
  return !!(cat && cat.private && isSealed(cat.lock) && !unlockedMap[cat.id])
}

const openUnlock = (cat) => {
  unlockTarget.value = cat
  unlockPwd.value = ''
  unlockErr.value = ''
  nextTick(() => unlockInput.value?.focus())
}

const closeUnlock = () => {
  unlockTarget.value = null
  unlockPwd.value = ''
  unlockErr.value = ''
}

const doUnlock = async () => {
  const cat = unlockTarget.value
  if (!cat || !unlockPwd.value) return
  unlocking.value = true
  unlockErr.value = ''
  try {
    const data = await openSealed(cat.lock, unlockPwd.value)
    cat.sites = Array.isArray(data?.sites) ? data.sites : []
    if (data?.name) cat.name = data.name
    unlockedMap[cat.id] = true
    closeUnlock()
  } catch {
    unlockErr.value = '口令不对，或者这个分类的密文已损坏'
  } finally {
    unlocking.value = false
  }
}

/** 立刻锁回去：只清内存，密文没动 */
const relock = (cat) => {
  cat.sites = []
  delete unlockedMap[cat.id]
}

/* ── 全站访问保护（环境变量控制） ── */
const isLocked = ref(false)
const isUnlocked = ref(false)
const unlockPassword = ref('')
const unlockError = ref('')

const checkLockStatus = () => {
  const openLock = import.meta.env.VITE_OPEN_LOCK
  if (openLock && openLock.trim() !== '') {
    isLocked.value = true
    if (localStorage.getItem('nav_unlocked') === 'true') isUnlocked.value = true
  } else {
    isLocked.value = false
    isUnlocked.value = true
  }
}

const handleUnlock = async () => {
  unlocking.value = true
  unlockError.value = ''
  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: unlockPassword.value })
    })
    const result = await response.json()
    if (!result.success) throw new Error(result.error || '访问密钥错误，请重新输入')
    isUnlocked.value = true
    localStorage.setItem('nav_unlocked', 'true')
    unlockPassword.value = ''
  } catch (e) {
    unlockError.value = e.message
  } finally {
    unlocking.value = false
  }
}

/* ── 站点图标兜底 ── */
const fallbackLetter = (name) => (name || '?').trim().charAt(0).toUpperCase()
const fallbackColor = (name) => {
  const key = name || '?'
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 360
  return `linear-gradient(135deg, hsl(${hash}, 46%, 58%), hsl(${(hash + 24) % 360}, 50%, 44%))`
}
const handleImageLoad = (event) => {
  event.target.closest('.site-icon')?.classList.add('icon-loaded')
}
const handleImageError = (event) => {
  event.target.remove()
}

/* ── 滚动 ── */
const showMobileMenu = ref(false)
const showBackTop = ref(false)
const activeCategory = ref('')

const smoothScrollTo = (container, targetTop, duration = 600) => {
  const startTop = container.scrollTop
  const distance = targetTop - startTop
  let startTime = null
  const animate = (t) => {
    if (startTime === null) startTime = t
    const p = Math.min((t - startTime) / duration, 1)
    const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
    container.scrollTop = startTop + distance * ease
    if (p < 1) requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}

const scrollToCategory = (categoryId) => {
  const element = document.getElementById(`category-${categoryId}`)
  const container = document.querySelector('.content-area')
  if (!element || !container) return
  const isMobile = window.innerWidth <= 768
  const header = document.querySelector('.search-header')
  const headerH = header ? header.offsetHeight : 80
  const targetTop = element.offsetTop - (isMobile ? headerH : headerH + 20)
  smoothScrollTo(container, Math.max(0, targetTop), 600)
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  document.body.style.overflow = showMobileMenu.value ? 'hidden' : ''
}
const closeMobileMenu = () => {
  showMobileMenu.value = false
  document.body.style.overflow = ''
}
const scrollToCategoryMobile = (categoryId) => {
  closeMobileMenu()
  setTimeout(() => scrollToCategory(categoryId), 200)
}

const scrollToTop = () => {
  const container = document.querySelector('.content-area')
  if (container) smoothScrollTo(container, 0, 500)
}

const onContentScroll = () => {
  const container = document.querySelector('.content-area')
  if (!container) return
  showBackTop.value = container.scrollTop > 400
  const containerTop = container.getBoundingClientRect().top
  let current = activeCategory.value
  for (const sec of container.querySelectorAll('.category-section')) {
    const top = sec.getBoundingClientRect().top - containerTop
    if (top <= 120) current = sec.id.replace('category-', '')
  }
  if (current) activeCategory.value = current
}

/* 「/」聚焦搜索框 */
const onGlobalKeydown = (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
  const el = e.target
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
  e.preventDefault()
  searchInputEl.value?.focus()
}

onMounted(async () => {
  checkLockStatus()
  window.addEventListener('keydown', onGlobalKeydown)
  document.addEventListener('click', onDocClick)
  await fetchCategories()
  selectedEngine.value = defaultSearchEngine.value

  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 20000)

  loadWeather()
  weatherTimer = setInterval(loadWeather, 30 * 60 * 1000)

  loadQuote()

  await nextTick()
  activeCategory.value = categories.value[0]?.id || ''
  const container = document.querySelector('.content-area')
  container?.addEventListener('scroll', onContentScroll, { passive: true })
  onContentScroll()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.removeEventListener('click', onDocClick)
  if (clockTimer) clearInterval(clockTimer)
  if (weatherTimer) clearInterval(weatherTimer)
  document.body.style.overflow = ''
  const container = document.querySelector('.content-area')
  container?.removeEventListener('scroll', onContentScroll)
})
</script>

<style scoped>
/* 移动端顶栏的站点标识（桌面端侧边栏已有 Logo） */
.m-brand {
  display: none;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 9px;
  overflow: hidden;
}
.m-brand img,
.m-brand svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
@media (max-width: 860px) {
  .m-brand {
    display: block;
  }
}

/* ── 全站锁定页 ── */
.lock-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(160deg, #101d31, #1b2c46 55%, #0f1929);
}
.lock-box {
  width: 100%;
  max-width: 350px;
  padding: 36px 28px 30px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.55);
  text-align: center;
}
.lock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
}
.lock-icon :deep(svg) {
  width: 24px;
  height: 24px;
}
.lock-box h1 {
  margin: 0 0 6px;
  font-size: 19px;
  font-weight: 650;
  color: var(--ink-1);
}
.lock-description {
  margin: 0 0 22px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.lock-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--field);
  color: var(--ink-1);
  font-size: 14px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.lock-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}
.unlock-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease;
}
.unlock-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.unlock-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.error-message {
  margin-top: 12px;
  font-size: 12.5px;
  color: #e5484d;
}

/* ── 布局 ── */
.nav-home {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink-1);
}

/* ── 侧边栏 ── */
.sidebar {
  width: 240px;
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
  object-fit: cover;
  box-shadow: 0 4px 12px -4px rgba(11, 21, 36, 0.5);
}
.site-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 650;
  letter-spacing: 0.3px;
  color: #f4f7fb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 14px;
  scrollbar-width: none;
}
.category-nav::-webkit-scrollbar {
  display: none;
}
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.category-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--sidebar-text);
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
  color: #fff;
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
.category-item .category-name {
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: 0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.category-item.active .category-name {
  font-weight: 600;
}

/* 图标容器：统一 22px 网格，颜色跟随文字 */
.cat-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  opacity: 0.9;
}
.cat-ico :deep(svg) {
  width: 18.5px;
  height: 18.5px;
}
.cat-ico :deep(.soft) {
  opacity: 0.5;
}
.category-item.active .cat-ico {
  opacity: 1;
  color: #9dc0ff;
}
.cat-ico.lg {
  width: 27px;
  height: 27px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent);
  opacity: 1;
}
.cat-ico.lg :deep(svg) {
  width: 16px;
  height: 16px;
}
.cat-lock {
  display: inline-flex;
  flex-shrink: 0;
  opacity: 0.5;
}
.cat-lock :deep(svg) {
  width: 12px;
  height: 12px;
}

/* ── 每日一句：填掉侧边栏底部空白，做成一张浅诗签 ── */
.daily-quote {
  position: relative;
  flex-shrink: 0;
  margin: 0 12px 8px;
  padding: 14px 14px 12px;
  border: 1px solid var(--sidebar-line);
  border-radius: 12px;
  background: linear-gradient(155deg, rgba(111, 155, 245, 0.13), rgba(111, 155, 245, 0.02) 72%);
  transition: border-color 0.2s ease;
}
.daily-quote:hover {
  border-color: rgba(157, 192, 255, 0.28);
}
.dq-text {
  margin: 0;
  font-size: 11.8px;
  line-height: 1.8;
  letter-spacing: 0.2px;
  text-wrap: pretty;
  color: #c3d2e6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: opacity 0.2s ease;
}
.daily-quote.is-loading .dq-text {
  opacity: 0.45;
}
.dq-from {
  margin: 8px 0 0;
  font-size: 11px;
  letter-spacing: 0.2px;
  color: #7d90a8;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dq-refresh {
  position: absolute;
  top: 7px;
  right: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7d90a8;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}
.dq-refresh svg {
  width: 13px;
  height: 13px;
}
.daily-quote:hover .dq-refresh,
.dq-refresh:focus-visible {
  opacity: 1;
}
.dq-refresh:hover {
  background: rgba(157, 192, 255, 0.14);
  color: #c3d2e6;
}
.dq-refresh:disabled {
  cursor: default;
  animation: dqSpin 0.9s linear infinite;
}
@keyframes dqSpin {
  to {
    transform: rotate(360deg);
  }
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 12px 12px 14px;
  border-top: 1px solid var(--sidebar-line);
}
.side-foot-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 10px;
  border-radius: 9px;
  color: var(--sidebar-text);
  font-size: 12.5px;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}
.side-foot-link:not(.is-plain):hover {
  background: var(--sidebar-hover);
  color: #fff;
}
.side-foot-link.is-plain {
  cursor: default;
}
.foot-ico {
  display: inline-flex;
  flex-shrink: 0;
}
.foot-ico :deep(svg) {
  width: 13px;
  height: 13px;
  stroke-width: 1.9;
}
.foot-txt {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 主区 ── */
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
  padding: 14px 28px;
  background: var(--surface-translucent);
  backdrop-filter: saturate(1.6) blur(14px);
  -webkit-backdrop-filter: saturate(1.6) blur(14px);
  border-bottom: 1px solid var(--line);
}

/* 与 .categories-container 同宽同中心，搜索框才会和下方内容左基线对齐 */
.head-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
}

/* 靠左、与下方内容区同一条左基线（24px→28px padding 对齐 .content-area） */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 620px;
  min-width: 0;
  max-width: 620px;
  height: 48px;
  margin: 0;
  padding: 0 8px 0 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.search-box:hover {
  border-color: var(--border-strong);
}
.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft), var(--shadow-md);
}
.s-ico {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--ink-3);
  transition: color 0.18s ease;
}
.s-ico :deep(svg) {
  width: 17px;
  height: 17px;
}
.search-box:focus-within .s-ico {
  color: var(--accent);
}

/* 搜索引擎下拉：右侧一个胶囊，点开选 */
.engine-pick {
  position: relative;
  flex-shrink: 0;
}
.eng-trigger {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 32px;
  padding: 0 8px 0 11px;
  border: none;
  border-radius: 9px;
  background: var(--surface-2);
  color: var(--ink-2);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}
.eng-trigger:hover {
  background: var(--surface-3);
  color: var(--ink-1);
}
.eng-trigger.open {
  background: var(--accent-soft);
  color: var(--accent);
}
.eng-chev {
  width: 13px;
  height: 13px;
  transition: transform 0.18s ease;
}
.eng-trigger.open .eng-chev {
  transform: rotate(180deg);
}
.eng-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  min-width: 118px;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  box-shadow: var(--shadow-md);
}
.eng-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  height: 32px;
  padding: 0 9px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-2);
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}
.eng-opt:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}
.eng-opt.on {
  color: var(--accent);
  font-weight: 600;
}
.eng-opt svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.eng-pop-enter-active,
.eng-pop-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.eng-pop-enter-from,
.eng-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink-1);
  font-family: inherit;
  font-size: 14px;
}
.search-input::placeholder {
  color: var(--ink-3);
}

.s-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: none;
  border-radius: 7px;
  background: var(--surface-3);
  color: var(--ink-2);
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}
.s-clear svg {
  width: 13px;
  height: 13px;
}
.s-clear:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

.search-kbd {
  display: flex;
  flex-shrink: 0;
  pointer-events: none;
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
.search-box:focus-within .search-kbd {
  opacity: 0;
}

/* ── 顶栏右侧 ── */
.head-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.clock {
  display: flex;
  align-items: center;
  gap: 26px;
  flex-shrink: 0;
  padding-right: 18px;
  border-right: 1px solid var(--line);
}
.c-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1.1;
  white-space: nowrap;
}
.c-time {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-1);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
}
.c-date {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-3);
  letter-spacing: 0.3px;
}
.c-wx {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1.1;
  white-space: nowrap;
  cursor: default;
}
.c-wx-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wx-ico {
  display: inline-flex;
  color: var(--accent);
}
.wx-ico :deep(svg) {
  width: 22px;
  height: 22px;
}
.c-temp {
  font-size: 20px;
  font-weight: 650;
  color: var(--ink-1);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}
.c-city {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-3);
  letter-spacing: 0.3px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
}
.icon-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}
.mobile-only {
  display: none;
}

/* ── 移动抽屉 ── */
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
  padding: 16px;
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
.mobile-quote {
  margin: 6px 10px 12px;
  flex-shrink: 0;
  border-color: var(--line);
  background: var(--accent-soft);
}
.mobile-quote .dq-text {
  color: var(--ink-2);
}
.mobile-quote .dq-from {
  color: var(--ink-3);
}
.mobile-quote .dq-refresh {
  opacity: 1;
  color: var(--ink-3);
}
.mobile-quote .dq-refresh:hover {
  background: rgba(59, 130, 246, 0.14);
  color: var(--accent);
}
.mobile-category-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--ink-1);
  transition: background-color 0.16s ease;
}
.mobile-category-item:active {
  background: var(--surface-2);
}
.mobile-category-item.active {
  background: var(--accent-soft);
}
.mobile-category-item.active .category-name {
  color: var(--accent);
  font-weight: 600;
}
.mobile-category-item .category-name {
  flex: 1;
  font-size: 14.5px;
  font-weight: 500;
}
.mobile-category-item .cat-ico {
  width: 24px;
  height: 24px;
}
.mobile-category-item .cat-ico :deep(svg) {
  width: 18px;
  height: 18px;
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

/* ── 内容 ── */
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
  to {
    transform: rotate(360deg);
  }
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

.filter-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 280px;
  color: var(--ink-2);
  font-size: 13.5px;
}
.filter-empty-icon {
  color: var(--ink-3);
  opacity: 0.5;
}
.filter-empty-icon :deep(svg) {
  width: 34px;
  height: 34px;
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
  margin-bottom: 38px;
  scroll-margin-top: 86px;
}
.category-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.2px;
  color: var(--ink-1);
}
.category-title .category-name {
  flex: none;
  font-size: inherit;
  font-weight: inherit;
}
.cat-relock {
  margin-left: 4px;
  padding: 2px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-3);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease;
}
.cat-relock:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.cat-empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--ink-3);
  font-size: 12.5px;
  text-align: center;
}

/* ── 私密分类入口卡 ── */
.vault {
  max-width: 520px;
}
.vault-btn {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 15px 17px;
  border: 1px dashed var(--border-strong);
  border-radius: 13px;
  background: var(--surface-2);
  color: var(--ink-1);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}
.vault-btn:hover {
  border-color: var(--accent);
  background: var(--surface);
  transform: translateY(-1px);
}
.vault-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}
.vault-ico :deep(svg) {
  width: 18px;
  height: 18px;
}
.vault-txt {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.vault-txt strong {
  font-size: 13.5px;
  font-weight: 600;
}
.vault-txt em {
  font-size: 11.8px;
  font-style: normal;
  color: var(--ink-3);
}
.vault-go {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
}

/* ── 解锁弹窗 ── */
.vault-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--overlay);
  backdrop-filter: blur(2px);
}
.vault-panel {
  width: 100%;
  max-width: 356px;
  padding: 20px;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.5);
}
.vp-head {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-bottom: 16px;
}
.vp-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}
.vp-ico :deep(svg) {
  width: 17px;
  height: 17px;
}
.vp-title {
  flex: 1;
  min-width: 0;
}
.vp-title h3 {
  margin: 0 0 3px;
  font-size: 15px;
  font-weight: 650;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vp-title p {
  margin: 0;
  font-size: 11.8px;
  color: var(--ink-3);
}
.vp-close {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-3);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}
.vp-close:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}
.vp-input {
  width: 100%;
  height: 42px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--field);
  color: var(--ink-1);
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 0.6px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.vp-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.vp-err {
  margin: 8px 0 0;
  font-size: 12px;
  color: #e5484d;
}
.vp-submit {
  width: 100%;
  height: 42px;
  margin-top: 12px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease;
}
.vp-submit:hover:not(:disabled) {
  background: var(--accent-hover);
}
.vp-submit:disabled {
  opacity: 0.5;
  cursor: default;
}
.vp-tip {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--ink-3);
}

/* ── 卡片 ── */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(212px, 1fr));
  gap: 12px;
}
.site-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
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
  position: relative;
  z-index: 1;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
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
  margin: 0 0 4px;
  font-size: 14.5px;
  font-weight: 650;
  letter-spacing: -0.05px;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.site-description {
  margin: 0;
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: 0.2px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 回到顶部 / 备案 ── */
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
}
.icp-footer a:hover {
  color: var(--accent);
}

/* ── 响应式 ── */
@media (max-width: 1180px) {
  .c-wx .c-city {
    display: none;
  }
}

@media (max-width: 1024px) {
  .sites-grid {
    grid-template-columns: repeat(auto-fill, minmax(206px, 1fr));
  }
  .search-header {
    padding: 12px 22px;
  }
  .head-wrap {
    gap: 12px;
  }
  .clock {
    gap: 12px;
    padding-right: 10px;
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
    padding: 9px 12px;
  }
  .head-wrap {
    gap: 8px;
  }
  .search-box {
    flex: 1 1 auto;
    max-width: none;
    height: 44px;
    margin: 0;
    padding: 0 7px 0 12px;
    gap: 7px;
    border-radius: 12px;
  }
  .s-ico,
  .search-kbd {
    display: none;
  }
  .eng-trigger {
    height: 30px;
    padding: 0 6px 0 9px;
    font-size: 12px;
  }
  .eng-chev {
    width: 12px;
    height: 12px;
  }
  .eng-menu {
    min-width: 104px;
  }
  .search-input {
    font-size: 13.5px;
  }
  .head-right {
    gap: 6px;
  }
  .clock {
    gap: 0;
    padding-right: 8px;
  }
  .c-time {
    font-size: 14px;
    letter-spacing: 0;
  }
  .c-date,
  .c-wx {
    display: none;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .mobile-only {
    display: flex;
  }
  .content-area {
    padding: 14px 14px 72px;
    padding-top: 70px;
    -webkit-overflow-scrolling: touch;
  }
  .category-section {
    margin-bottom: 26px;
    scroll-margin-top: 60px;
  }
  .category-title {
    font-size: 14.5px;
    margin-bottom: 11px;
  }
  .cat-ico.lg {
    width: 24px;
    height: 24px;
  }
  .cat-ico.lg :deep(svg) {
    width: 14px;
    height: 14px;
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
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    word-break: break-word;
    line-height: 1.38;
    font-size: 11px;
  }
  .vault {
    max-width: none;
  }
  .vault-btn {
    padding: 13px 14px;
    gap: 11px;
  }
  .vault-go {
    display: none;
  }
  .back-top-btn {
    right: 16px;
    bottom: 18px;
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
