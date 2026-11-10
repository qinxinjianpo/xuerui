<template>
  <div class="st">
   <div class="st-col">
    <!-- 基本信息 -->
    <section class="card">
      <header class="card-head">
        <div>
          <h2>基本信息</h2>
          <p>网站标题会显示在浏览器标签和侧边栏顶部</p>
        </div>
      </header>
      <div class="grid-2">
        <label class="fld">
          <span>网站标题</span>
          <input v-model="form.title" maxlength="24" placeholder="例如：琴心剑魄。" @input="mark()" />
        </label>
        <label class="fld">
          <span>默认搜索引擎</span>
          <select v-model="form.search" @change="mark()">
            <option value="bing">Bing</option>
            <option value="baidu">百度</option>
          </select>
        </label>
      </div>
    </section>

    <!-- 侧边栏底部 -->
    <section class="card">
      <header class="card-head">
        <div>
          <h2>侧边栏底部</h2>
          <p>显示在分类列表下方的那一行，可以带链接</p>
        </div>
      </header>
      <div class="grid-2">
        <label class="fld">
          <span>文字</span>
          <input v-model="form.footerText" maxlength="24" placeholder="愿逐月华流照君" @input="mark()" />
        </label>
        <label class="fld">
          <span>链接地址</span>
          <input v-model="form.footerUrl" placeholder="https://… （留空则只显示文字）" @input="mark()" />
        </label>
      </div>
      <p v-if="footerUrlBad" class="warn">地址需要以 http:// 或 https:// 开头</p>
    </section>

   </div>
   <div class="st-col">
    <!-- Logo -->
    <section class="card">
      <header class="card-head">
        <div>
          <h2>网站 Logo</h2>
          <p>替换侧边栏左上角的图标，建议正方形 PNG，至少 128×128</p>
        </div>
      </header>
      <div class="logo-row">
        <div class="logo-box">
          <img v-if="logoPreview" :src="logoPreview" alt="Logo 预览" />
          <div v-else class="logo-none">
            <UiIcon name="image" :size="22" />
            <span>未设置</span>
          </div>
        </div>
        <div class="logo-actions">
          <input ref="fileEl" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="onPick" />
          <button type="button" class="btn ghost" @click="fileEl?.click()">
            <UiIcon name="upload" :size="15" />
            选择图片
          </button>
          <button v-if="form.logo" type="button" class="btn ghost danger" @click="clearLogo">
            移除
          </button>
          <p class="logo-hint">
            {{ pendingFile ? `已选择 ${pendingFile.name}，点右上角「保存」上传` : '保存后上传到仓库 public/logo.png' }}
          </p>
        </div>
      </div>
    </section>

    <!-- GitHub -->
    <section class="card">
      <header class="card-head">
        <div>
          <h2>GitHub 连接</h2>
          <p>保存会把改动提交到仓库，Cloudflare Pages 随后自动部署</p>
        </div>
        <button type="button" class="btn ghost sm" :disabled="checking" @click="check">
          {{ checking ? '检查中…' : '重新检查' }}
        </button>
      </header>
      <div class="gh-row">
        <span class="dot" :class="gh.ok ? 'on' : 'off'"></span>
        <div class="gh-text">
          <p class="gh-main">{{ gh.ok ? `已连接 ${gh.repo || ''}` : '未连接' }}</p>
          <p class="gh-sub">{{ gh.ok ? '可以正常保存' : gh.error || '请检查仓库配置和 Token' }}</p>
        </div>
      </div>
    </section>
   </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import UiIcon from './UiIcon.vue'
import { useGitHubAPI } from '../../apis/useGitHubAPI.js'

const emit = defineEmits(['dirty', 'logo'])

const { verifyGitHubConnection } = useGitHubAPI()

// 由父组件传入当前数据并接收变更
const props = defineProps({
  model: { type: Object, required: true }
})

const form = reactive({
  title: props.model.title || '',
  search: props.model.search || 'bing',
  footerText: props.model.footer?.text || '',
  footerUrl: props.model.footer?.url || '',
  logo: props.model.logo || ''
})

const mark = () => emit('dirty')

const footerUrlBad = computed(
  () => !!form.footerUrl && !/^https?:\/\//i.test(form.footerUrl.trim())
)

/* ── Logo ── */
const fileEl = ref(null)
const pendingFile = ref(null)
const logoPreview = ref(form.logo || '')

const onPick = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    emit('dirty', '图标不能超过 2MB')
    return
  }
  pendingFile.value = file
  logoPreview.value = URL.createObjectURL(file)
  emit('logo', file)
  mark()
}

const clearLogo = () => {
  form.logo = ''
  logoPreview.value = ''
  pendingFile.value = null
  emit('logo', null)
  mark()
}

/* ── GitHub 状态 ── */
const gh = reactive({ ok: false, repo: '', error: '' })
const checking = ref(false)

const check = async () => {
  checking.value = true
  try {
    const r = await verifyGitHubConnection()
    gh.ok = !!r?.connected
    gh.repo = r?.repo || ''
    gh.error = r?.error || ''
  } catch (e) {
    gh.ok = false
    gh.error = e.message || ''
  } finally {
    checking.value = false
  }
}

onMounted(check)

/** 供父组件取当前表单值 */
const getValues = () => ({
  title: form.title.trim() || '导航',
  search: form.search === 'baidu' ? 'baidu' : 'bing',
  footer: {
    text: form.footerText.trim() || '愿逐月华流照君',
    url: form.footerUrl.trim()
  },
  logo: form.logo
})

const setLogoPath = (path) => {
  form.logo = path
  logoPreview.value = path
}

defineExpose({ getValues, setLogoPath, form, footerUrlBad })
</script>

<style scoped>
.st {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.st-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.card {
  padding: 18px 20px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}
.card-head h2 {
  margin: 0 0 4px;
  font-size: 14.5px;
  font-weight: 650;
  letter-spacing: -0.1px;
  color: var(--ink-1);
}
.card-head p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-3);
}
.card-head .btn {
  margin-left: auto;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fld > span {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}
.fld input,
.fld select {
  height: 38px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--field);
  color: var(--ink-1);
  font-family: inherit;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.fld input:focus,
.fld select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  background: var(--surface);
}
.warn {
  margin: 10px 0 0;
  font-size: 12px;
  color: #b45309;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 18px;
}
.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface-2);
}
.logo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logo-none {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: var(--ink-3);
  font-size: 10.5px;
}
.logo-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.logo-hint {
  flex-basis: 100%;
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}

.gh-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface-2);
}
.dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}
.dot.on {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}
.dot.off {
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.13);
}
.gh-main {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-1);
}
.gh-sub {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border-radius: 9px;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 550;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.btn.sm {
  height: 30px;
  padding: 0 10px;
  font-size: 12.5px;
}
.btn.ghost {
  border-color: var(--line);
  background: var(--surface);
  color: var(--ink-2);
}
.btn.ghost:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--ink-1);
  background: var(--surface-2);
}
.btn.danger {
  color: #dc2626;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1080px) {
  .st {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
