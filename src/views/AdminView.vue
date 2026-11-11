<template>
  <div class="ad">
    <!-- ── 登录 ── -->
    <div v-if="!ready" class="login">
      <form class="login-card" @submit.prevent="doLogin">
        <div class="login-logo">
          <BrandLogo :src="settingsModel.logo" />
        </div>
        <h1>导航站管理</h1>
        <p class="login-sub">输入管理密钥进入后台</p>

        <label class="login-fld">
          <UiIcon name="key" :size="16" />
          <input
            v-model="pwd"
            type="password"
            placeholder="管理密钥"
            autocomplete="current-password"
            autofocus
            required
          />
        </label>

        <p v-if="loginErr" class="login-err">{{ loginErr }}</p>

        <button type="submit" class="login-btn" :disabled="busy">
          {{ busy ? '验证中…' : '进入后台' }}
        </button>

        <button type="button" class="login-back" @click="$router.push('/')">← 返回前台</button>
      </form>
    </div>

    <!-- ── 后台 ── -->
    <template v-else>
      <header class="bar">
        <div class="bar-inner">
          <div class="brand">
            <span class="brand-ico"><BrandLogo :src="settingsModel.logo" /></span>
            <span class="brand-txt">导航站管理</span>
            <span v-if="dirty" class="brand-dot" title="有未保存的改动">未保存</span>
          </div>

          <nav class="tabs">
            <button
              type="button"
              class="tab"
              :class="{ on: tab === 'edit' }"
              @click="tab = 'edit'"
            >
              <UiIcon name="layers" :size="15" />
              内容
            </button>
            <button
              type="button"
              class="tab"
              :class="{ on: tab === 'config' }"
              @click="tab = 'config'"
            >
              <UiIcon name="sliders" :size="15" />
              设置
            </button>
          </nav>

          <div class="bar-right">
            <a class="bar-link" href="/" target="_blank" rel="noopener">预览 ↗</a>
            <button type="button" class="bar-btn" @click="logout">退出</button>
            <button type="button" class="save-btn" :disabled="saving || !dirty" @click="save">
              <UiIcon v-if="!saving" name="download" :size="15" />
              <span class="spin" v-else></span>
              {{ saving ? '保存中…' : dirty ? '保存到 GitHub' : '已是最新' }}
            </button>
          </div>
        </div>
      </header>

      <main class="body">
        <div v-if="loading" class="skeleton">
          <div class="sk-side"></div>
          <div class="sk-main"><div class="sk-line"></div><div class="sk-line short"></div><div class="sk-line"></div></div>
        </div>

        <Workspace
          v-else-if="tab === 'edit'"
          :w="ws"
          v-model:activeId="activeId"
          @toast="showToast"
        />

        <Settings
          v-else
          ref="settingsEl"
          :model="settingsModel"
          @dirty="onSettingsDirty"
          @logo="onLogoPick"
        />
      </main>
    </template>

    <!-- 轻提示 -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.text }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mockData } from '../mock/mock_data.js'
import { useGitHubAPI, setAuthToken, clearAuthToken } from '../apis/useGitHubAPI.js'
import { useWorkspace } from '../utils/workspace.js'

import BrandLogo from '../components/BrandLogo.vue'
import UiIcon from '../components/admin/UiIcon.vue'
import Workspace from '../components/admin/Workspace.vue'
import Settings from '../components/admin/Settings.vue'

const router = useRouter()

const { loadCategoriesFromGitHub, saveCategoriesToGitHub, uploadBinaryFile } = useGitHubAPI()

const ready = ref(false)
const pwd = ref('')
const loginErr = ref('')
const busy = ref(false)
const loading = ref(false)
const saving = ref(false)

const tab = ref('edit')
const activeId = ref('')

// 初始数据：先用源码里的 mock（部署后就是最新），登录后再尝试从 GitHub 取更新的
const ws = useWorkspace(mockData.categories || [])
const dirty = ws.dirty

const settingsModel = reactive({
  title: mockData.title || '',
  search: mockData.search || 'bing',
  footer: mockData.footer || { text: '', url: '' },
  logo: mockData.logo || '/logo.png'
})

const settingsEl = ref(null)
const pendingLogo = ref(null)

const onSettingsDirty = (msg) => {
  dirty.value = true
  if (typeof msg === 'string' && msg) showToast(msg, 'warn')
}

const onLogoPick = (file) => {
  pendingLogo.value = file
}

/* ── 登录 ── */
const doLogin = async () => {
  busy.value = true
  loginErr.value = ''
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd.value })
    })
    const result = await res.json()
    if (!result.success) throw new Error(result.error || '密钥不对')

    setAuthToken(result.token)
    localStorage.setItem('admin_authenticated', 'true')
    ready.value = true
    activeId.value = ws.categories.value[0]?.id || ''
    refreshFromGitHub()
  } catch (e) {
    loginErr.value = e.message || '验证失败'
  } finally {
    busy.value = false
  }
}

/** 登录后静默拉一次仓库数据，有更新的直接替换（失败就继续用源码里的） */
const refreshFromGitHub = async () => {
  loading.value = true
  try {
    const remote = await loadCategoriesFromGitHub()
    if (!remote?.categories) throw new Error('格式不对')
    ws.reload(remote.categories)
    settingsModel.title = remote.title || settingsModel.title
    settingsModel.search = remote.search === 'baidu' ? 'baidu' : 'bing'
    settingsModel.footer = remote.footer || settingsModel.footer
    settingsModel.logo = remote.logo || ''
    settingsEl.value?.setLogoPath(settingsModel.logo)
    activeId.value = ws.categories.value[0]?.id || ''
  } catch {
    // 拉不到就用源码里的数据，不打断操作
  } finally {
    loading.value = false
  }
}

const logout = () => {
  clearAuthToken()
  localStorage.removeItem('admin_authenticated')
  ready.value = false
  router.push('/')
}

/* ── 保存 ── */
const save = async () => {
  if (saving.value) return

  const vals = tab.value === 'config' && settingsEl.value ? settingsEl.value.getValues() : null
  if (settingsEl.value?.footerUrlBad) {
    showToast('侧边栏链接地址格式不对', 'warn')
    tab.value = 'config'
    return
  }

  saving.value = true
  try {
    // 先拿仓库现有数据，保留我们不管的字段
    let carry = {}
    try {
      const cur = (await loadCategoriesFromGitHub()) || {}
      carry = { ...cur }
      delete carry._fileSha
    } catch {
      carry = {}
    }

    const { categories, sealed } = await ws.exportCategories()

    const meta = vals || {
      title: settingsModel.title,
      search: settingsModel.search,
      footer: settingsModel.footer,
      logo: settingsModel.logo
    }

    // Logo：选了新文件就先传，再写路径
    let logoPath = meta.logo || ''
    if (pendingLogo.value) {
      const buf = await pendingLogo.value.arrayBuffer()
      await uploadBinaryFile('public/logo.png', buf, 'chore: 更新网站 Logo')
      logoPath = '/logo.png'
      settingsEl.value?.setLogoPath(logoPath)
      pendingLogo.value = null
    }

    await saveCategoriesToGitHub({
      ...carry,
      categories,
      title: meta.title,
      search: meta.search,
      footer: meta.footer,
      logo: logoPath
    })

    // 保存成功后同步本地状态
    Object.assign(settingsModel, meta, { logo: logoPath })
    ws.reload(categories.map((c) => ({ ...c, sites: c.sites || [] })))
    dirty.value = false
    showToast(
      sealed
        ? `已保存，其中 ${sealed} 个私密分类已加密`
        : '已保存到 GitHub，2-3 分钟后生效'
    )
  } catch (e) {
    showToast(e.message || '保存失败', 'warn')
  } finally {
    saving.value = false
  }
}

/* ── 提示 ── */
const toast = ref(null)
let toastTimer = null

const showToast = (text, type = 'ok') => {
  toast.value = { text, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 3200)
}

onMounted(() => {
  // 主题已在 useThemeStore 定义时同步到 <html>，这里只需让 localStorage 里的登录态生效
  if (localStorage.getItem('admin_authenticated') === 'true') {
    ready.value = true
    activeId.value = ws.categories.value[0]?.id || ''
  }
})
</script>

<style scoped>
.ad {
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink-1);
}

/* ── 登录 ── */
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 348px;
  padding: 30px 28px 24px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: var(--surface);
  box-shadow: 0 20px 48px -24px rgba(15, 23, 42, 0.28);
  text-align: center;
}
.login-logo {
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 20px -8px rgba(11, 21, 36, 0.5);
}
.login-logo :deep(img),
.login-logo :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.login-card h1 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.2px;
}
.login-sub {
  margin: 0 0 22px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.login-fld {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--field);
  color: var(--ink-3);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.login-fld:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  background: var(--surface);
}
.login-fld input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--ink-1);
  font-family: inherit;
  font-size: 13.5px;
  outline: none;
}
.login-btn {
  width: 100%;
  height: 42px;
  margin-top: 14px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.login-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.login-err {
  margin: 11px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fdf2f2;
  color: #b91c1c;
  font-size: 12.5px;
}
.login-back {
  margin-top: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--ink-3);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
.login-back:hover {
  color: var(--accent);
}

/* ── 顶栏 ── */
.bar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 24px;
  background: var(--surface-translucent);
  backdrop-filter: saturate(1.6) blur(14px);
  -webkit-backdrop-filter: saturate(1.6) blur(14px);
  border-bottom: 1px solid var(--line);
}
.bar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1360px;
  height: 58px;
  margin: 0 auto;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
}
.brand-ico {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  overflow: hidden;
}
.brand-ico :deep(img),
.brand-ico :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.brand-txt {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.1px;
}
.brand-dot {
  padding: 2px 7px;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309;
  font-size: 10.5px;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: var(--surface-3);
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-2);
  font-family: inherit;
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.tab:hover {
  color: var(--ink-1);
}
.tab.on {
  background: var(--surface);
  color: var(--ink-1);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.09);
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
.bar-link,
.bar-btn {
  padding: 6px 9px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-3);
  font-family: inherit;
  font-size: 12.5px;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.14s ease, background-color 0.14s ease;
}
.bar-link:hover,
.bar-btn:hover {
  color: var(--ink-1);
  background: var(--surface-2);
}
.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 15px;
  border: none;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}
.save-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.save-btn:disabled {
  background: var(--surface-3);
  color: var(--ink-3);
  cursor: default;
}
.spin {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: sp 0.7s linear infinite;
}
@keyframes sp {
  to {
    transform: rotate(360deg);
  }
}

/* ── 主体 ── */
.body {
  max-width: 1360px;
  margin: 0 auto;
  padding: 20px 24px 46px;
}

.skeleton {
  display: flex;
  gap: 18px;
}
.sk-side {
  width: 268px;
  height: 420px;
  border-radius: 14px;
  background: var(--surface-2);
  animation: pulse 1.4s ease-in-out infinite;
}
.sk-main {
  flex: 1;
  padding: 22px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
}
.sk-line {
  height: 14px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: var(--surface-2);
  animation: pulse 1.4s ease-in-out infinite;
}
.sk-line.short {
  width: 42%;
}
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

/* ── 提示条 ── */
.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  z-index: 3000;
  transform: translateX(-50%);
  padding: 10px 18px;
  border-radius: 10px;
  background: #111827;
  color: #f9fafb;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.45);
}
.toast.warn {
  background: #b91c1c;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-width: 860px) {
  .bar {
    padding: 0 14px;
  }
  .bar-inner {
    gap: 10px;
    height: 54px;
  }
  .brand-txt,
  .bar-link {
    display: none;
  }
  .tab {
    padding: 0 10px;
    font-size: 12.5px;
  }
  .body {
    padding: 14px 14px 40px;
  }
  .skeleton {
    flex-direction: column;
  }
  .sk-side {
    width: 100%;
  }
}
</style>
