<template>
  <div class="ws">
    <!-- ── 左栏：分类 ── -->
    <aside class="ws-side">
      <div class="side-head">
        <span class="side-title">分类</span>
        <span class="side-count">{{ w.categories.value.length }}</span>
        <button type="button" class="side-add" title="新建分类" @click="createCategory">
          <UiIcon name="plus" :size="16" />
        </button>
      </div>

      <draggable
        v-model="catList"
        item-key="id"
        handle=".cat-grip"
        :animation="180"
        ghost-class="drag-ghost"
        class="cat-list"
        @end="onCatSortEnd"
      >
        <template #item="{ element: cat }">
          <div
            class="cat-row"
            :class="{ active: cat.id === activeId, locked: w.isLocked(cat) }"
            :data-cat-id="cat.id"
            draggable="true"
            @dragstart="onCatDragStart(cat.id, $event)"
            @dragover.prevent="onCatDragOver(cat.id, $event)"
            @dragleave="onCatDragLeave"
            @drop.prevent="onDropToCategory(cat.id)"
            @dragend="onDropCleanup"
            @click="selectCategory(cat.id)"
            @dblclick="startCatName(cat)"
          >
            <span class="cat-grip" title="拖拽排序" @click.stop>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <circle cx="9" cy="7" r="1.4" /><circle cx="15" cy="7" r="1.4" />
                <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
                <circle cx="9" cy="17" r="1.4" /><circle cx="15" cy="17" r="1.4" />
              </svg>
            </span>

            <span class="cat-ico"><UiIcon :name="cat.icon" :size="16" /></span>

            <input
              v-if="editingCatId === cat.id"
              ref="catInputEl"
              v-model="catDraft"
              class="cat-input"
              maxlength="20"
              @click.stop
              @keydown.enter.prevent="commitCatName(cat)"
              @keydown.esc.prevent="cancelCatName"
              @blur="commitCatName(cat)"
            />
            <span v-else class="cat-name" @click.stop="onCatNameClick(cat)">{{ cat.name }}</span>

            <UiIcon v-if="w.isLocked(cat)" name="lock" :size="12" class="cat-lock" />
            <span class="cat-num">{{ w.siteCount(cat) }}</span>

            <button
              type="button"
              class="cat-del"
              :title="`删除「${cat.name}」`"
              @click.stop="askDeleteCategory(cat)"
            >
              <UiIcon name="x" :size="13" />
            </button>
          </div>
        </template>
      </draggable>

      <p v-if="!w.categories.value.length" class="side-empty">还没有分类，点右上角 + 新建</p>
      <p class="side-tip">拖分类调整顺序；把右侧站点拖到这里可换分类</p>
    </aside>

    <!-- ── 右栏：站点 ── -->
    <section class="ws-main">
      <template v-if="activeCat">
        <!-- 分类头 -->
        <header class="cat-head">
          <div class="ch-left">
            <button type="button" class="ch-ico" title="更换图标" @click="iconOpen = !iconOpen">
              <UiIcon :name="activeCat.icon" :size="20" />
            </button>
            <div class="ch-text">
              <h2 class="ch-name">{{ activeCat.name }}</h2>
              <p class="ch-meta">
                <span>{{ w.siteCount(activeCat) }} 个站点</span>
                <span v-if="activeCat.private" class="ch-pill">
                  <UiIcon name="lock" :size="11" />
                  {{ w.isLocked(activeCat) ? '已加密' : '已解锁' }}
                </span>
              </p>
            </div>
          </div>

          <div class="ch-right">
            <button
              v-if="!activeCat.private"
              type="button"
              class="btn ghost"
              @click="openPrivate"
            >
              <UiIcon name="shield" :size="15" />
              设为私密
            </button>
            <button
              v-else-if="w.isLocked(activeCat)"
              type="button"
              class="btn primary"
              @click="unlockOpen = true"
            >
              <UiIcon name="key" :size="15" />
              解锁编辑
            </button>
            <template v-else>
              <button type="button" class="btn ghost" @click="pwdOpen = true">
                <UiIcon name="key" :size="15" />
                换口令
              </button>
              <button type="button" class="btn ghost" @click="relockNow">
                <UiIcon name="lock" :size="15" />
                上锁
              </button>
              <button type="button" class="btn ghost danger" @click="cancelPrivate">
                取消私密
              </button>
            </template>
          </div>
        </header>

        <!-- 图标选择（点标题左侧图标展开） -->
        <div v-if="iconOpen" class="icon-panel">
          <IconPicker v-model="activeCat.icon" @update:modelValue="onPickIcon" />
        </div>

        <!-- 私密分类锁定：只显示解锁入口 -->
        <div v-if="w.isLocked(activeCat)" class="locked-box">
          <div class="lb-ico"><UiIcon name="lock" :size="26" /></div>
          <h3>这个分类已加密</h3>
          <p>站点内容已用口令加密，仓库里只有密文。输入口令后才能查看和编辑。</p>
          <button type="button" class="btn primary" @click="unlockOpen = true">
            <UiIcon name="key" :size="15" />
            输入口令解锁
          </button>
        </div>

        <!-- 站点列表 -->
        <template v-else>
          <draggable
            v-model="siteList"
            item-key="id"
            handle=".row-grip"
            :animation="180"
            ghost-class="drag-ghost"
            class="site-list"
            @end="onDropCleanup"
          >
            <template #item="{ element: site }">
              <div
                class="site-row"
                :class="{ open: editId === site.id }"
                draggable="true"
                @dragstart="onSiteDragStart(site.id, $event)"
                @dragend="onDropCleanup"
              >
                <span class="row-grip" title="拖拽排序，拖到左侧分类可移动">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <circle cx="9" cy="7" r="1.4" /><circle cx="15" cy="7" r="1.4" />
                    <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
                    <circle cx="9" cy="17" r="1.4" /><circle cx="15" cy="17" r="1.4" />
                  </svg>
                </span>

                <Favicon :url="site.url" :icon="site.icon" :name="site.name" />

                <div class="row-body" @click="startEdit(site)">
                  <div class="row-line">
                    <input
                      v-if="editId === site.id"
                      ref="nameInputEl"
                      v-model="draft.name"
                      class="row-name-input"
                      placeholder="站点名称"
                      @click.stop
                      @keydown.enter.prevent="commitEdit(site)"
                      @keydown.esc.prevent="cancelEdit"
                    />
                    <template v-else>
                      <span class="row-name">{{ site.name || '未命名' }}</span>
                      <span class="row-host">{{ hostOf(site.url) }}</span>
                    </template>
                  </div>
                  <p v-if="editId !== site.id && site.description" class="row-desc">{{ site.description }}</p>

                  <div v-if="editId === site.id" class="row-form" @click.stop>
                    <label class="fld">
                      <span>地址</span>
                      <input
                        v-model="draft.url"
                        type="url"
                        placeholder="https://example.com"
                        @keydown.enter.prevent="commitEdit(site)"
                      />
                    </label>
                    <label class="fld">
                      <span>描述</span>
                      <input
                        v-model="draft.description"
                        placeholder="一句话说明"
                        @keydown.enter.prevent="commitEdit(site)"
                      />
                    </label>
                    <label class="fld">
                      <span>图标地址</span>
                      <input
                        v-model="draft.icon"
                        placeholder="留空自动取网站图标"
                        @keydown.enter.prevent="commitEdit(site)"
                      />
                    </label>
                    <div class="row-form-actions">
                      <button type="button" class="btn primary sm" @click="commitEdit(site)">保存</button>
                      <button type="button" class="btn ghost sm" @click="cancelEdit">取消</button>
                    </div>
                  </div>
                </div>

                <button
                  v-if="editId !== site.id"
                  type="button"
                  class="row-del"
                  title="删除站点"
                  @click.stop="askDeleteSite(site)"
                >
                  <UiIcon name="x" :size="14" />
                </button>
              </div>
            </template>
          </draggable>

          <p v-if="!siteList.length" class="site-empty">
            这个分类还没有站点，在下面输入名字回车就能加
          </p>

          <!-- 快速添加 -->
          <div class="quick-add">
            <UiIcon name="plus" :size="15" class="qa-ico" />
            <input
              v-model="newSiteName"
              class="qa-input"
              placeholder="添加站点：输入名称后回车"
              @keydown.enter.prevent="quickAdd"
            />
            <button type="button" class="btn ghost sm" :disabled="!newSiteName.trim()" @click="quickAdd">
              添加
            </button>
          </div>
        </template>
      </template>

      <div v-else class="main-empty">
        <div class="me-ico"><UiIcon name="folder" :size="30" /></div>
        <h3>还没有选择分类</h3>
        <p>左侧点一个分类，或新建一个开始</p>
        <button type="button" class="btn primary" @click="createCategory">
          <UiIcon name="plus" :size="15" />
          新建分类
        </button>
      </div>
    </section>

    <!-- ── 弹层 ── -->
    <BaseModal v-if="privateOpen" title="设为私密分类" @close="closePrivate">
      <p class="md-hint">
        设好后这个分类下 <b>{{ w.siteCount(privateTarget) }}</b> 个站点会被整体加密，
        仓库里只留密文。前台需要输入口令才能展开。
      </p>
      <label class="md-field">
        <span>设置口令</span>
        <input v-model="privatePwd" type="password" placeholder="至少 6 位，忘了就打不开" autocomplete="new-password" />
      </label>
      <label class="md-field">
        <span>再输一次</span>
        <input v-model="privatePwd2" type="password" placeholder="确认口令" autocomplete="new-password" />
      </label>
      <p v-if="privateErr" class="md-err">{{ privateErr }}</p>
      <template #footer>
        <button type="button" class="btn ghost" @click="closePrivate">取消</button>
        <button type="button" class="btn primary" :disabled="privateBusy" @click="confirmPrivate">
          {{ privateBusy ? '加密中…' : '加密并保存到内存' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-if="unlockOpen" title="输入口令解锁" @close="unlockOpen = false">
      <p class="md-hint">解锁后可以查看和编辑站点内容。口令只在当前页面内存里，不保存、不上传。</p>
      <label class="md-field">
        <span>口令</span>
        <input v-model="unlockPwd" type="password" placeholder="输入这个分类的口令" autocomplete="current-password" @keydown.enter="confirmUnlock" />
      </label>
      <p v-if="unlockErr" class="md-err">{{ unlockErr }}</p>
      <template #footer>
        <button type="button" class="btn ghost" @click="unlockOpen = false">取消</button>
        <button type="button" class="btn primary" :disabled="unlockBusy" @click="confirmUnlock">
          {{ unlockBusy ? '解密中…' : '解锁' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-if="pwdOpen" title="更换口令" @close="pwdOpen = false">
      <label class="md-field">
        <span>原口令</span>
        <input v-model="pwdOld" type="password" placeholder="留空则用刚才解锁时的口令" />
      </label>
      <label class="md-field">
        <span>新口令</span>
        <input v-model="pwdNew" type="password" placeholder="至少 6 位" />
      </label>
      <p v-if="pwdErr" class="md-err">{{ pwdErr }}</p>
      <template #footer>
        <button type="button" class="btn ghost" @click="pwdOpen = false">取消</button>
        <button type="button" class="btn primary" @click="confirmPwd">确认更换</button>
      </template>
    </BaseModal>

    <BaseModal v-if="confirmAsk" :title="confirmAsk.title" @close="confirmAsk = null">
      <p class="md-hint">{{ confirmAsk.message }}</p>
      <template #footer>
        <button type="button" class="btn ghost" @click="confirmAsk = null">取消</button>
        <button type="button" class="btn primary danger-fill" @click="runConfirm">确定删除</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import UiIcon from './UiIcon.vue'
import IconPicker from './IconPicker.vue'
import Favicon from './Favicon.vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  w: { type: Object, required: true },
  activeId: { type: String, default: '' }
})
const emit = defineEmits(['update:activeId'])

const w = props.w

/* ── 选中分类 ── */
const activeCat = computed(() => w.findCategory(props.activeId))

const selectCategory = (id) => {
  if (id === props.activeId) return
  cancelEdit()
  cancelCatName()
  iconOpen.value = false
  emit('update:activeId', id)
}

/* ── 分类：列表与拖拽 ── */
const catList = ref([])
watch(
  () => w.categories.value,
  (v) => {
    catList.value = v
    if (!props.activeId && v.length) emit('update:activeId', v[0].id)
    if (props.activeId && !v.some((c) => c.id === props.activeId) && v.length) {
      emit('update:activeId', v[0].id)
    }
  },
  { immediate: true, deep: false }
)

// 拖拽状态：kind 区分拖的是分类还是站点
let drag = { kind: '', id: '' }

const onCatDragStart = (id, e) => {
  drag = { kind: 'cat', id }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
}

const onSiteDragStart = (id, e) => {
  drag = { kind: 'site', id }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
  document.querySelectorAll('.cat-row').forEach((el) => el.classList.add('drop-hint'))
}

const onCatDragOver = (id, e) => {
  if (drag.kind !== 'site') return
  if (id === props.activeId) return
  // 站点悬停在别的分类上：给可投放的视觉提示
  e.currentTarget?.classList.add('over')
}

/** 松手清掉所有临时样式与状态 */
const onDropCleanup = () => {
  drag = { kind: '', id: '' }
  document.querySelectorAll('.cat-row.over').forEach((el) => el.classList.remove('over'))
  document.querySelectorAll('.cat-row.drop-hint').forEach((el) => el.classList.remove('drop-hint'))
}

/** 拖分类排序结束 */
const onCatSortEnd = (evt) => {
  const { oldIndex, newIndex } = evt
  if (oldIndex !== newIndex) {
    const list = w.categories.value
    const [item] = list.splice(oldIndex, 1)
    list.splice(newIndex, 0, item)
    list.forEach((c, i) => { c.order = i })
    w.touch()
  }
  onDropCleanup()
}

/** 站点拖到某个分类行上松手：移动过去 */
const onDropToCategory = (catId) => {
  if (drag.kind !== 'site') return
  if (catId !== props.activeId) {
    const ok = w.moveSite(props.activeId, catId, drag.id)
    if (ok) emit('toast', '已移动到「' + (w.findCategory(catId)?.name || '') + '」')
  }
  onDropCleanup()
}

/** 分类行拖入时高亮（dragover 里加类，dragleave 去掉） */
const onCatDragLeave = (e) => {
  e.currentTarget?.classList.remove('over')
}

/* ── 分类：就地改名 ── */
const editingCatId = ref('')
const catDraft = ref('')
const catInputEl = ref(null)

/** 点分类名：没选中就先选中（多数人的第一意图是切换），已选中再点一次才改名 */
const onCatNameClick = (cat) => {
  if (cat.id !== props.activeId) {
    selectCategory(cat.id)
    return
  }
  startCatName(cat)
}

const startCatName = async (cat) => {
  editingCatId.value = cat.id
  catDraft.value = cat.name
  await nextTick()
  const el = Array.isArray(catInputEl.value) ? catInputEl.value[0] : catInputEl.value
  el?.focus()
  el?.select()
}

const commitCatName = (cat) => {
  if (editingCatId.value !== cat.id) return
  const name = catDraft.value.trim()
  if (name && name !== cat.name) {
    cat.name = name
    w.touch()
  }
  editingCatId.value = ''
}

const cancelCatName = () => {
  editingCatId.value = ''
}

const createCategory = async () => {
  const cat = w.addCategory()
  emit('update:activeId', cat.id)
  await nextTick()
  startCatName(cat)
}

/* ── 分类：删除 ── */
const confirmAsk = ref(null)

const askDeleteCategory = (cat) => {
  const n = w.siteCount(cat)
  confirmAsk.value = {
    title: `删除分类「${cat.name}」`,
    message: n
      ? `这个分类下还有 ${n} 个站点，删除会一起清掉，且无法撤销。`
      : '这个分类是空的，删除后无法撤销。',
    run: () => {
      w.removeCategory(cat.id)
      if (props.activeId === cat.id) {
        emit('update:activeId', w.categories.value[0]?.id || '')
      }
    }
  }
}

const runConfirm = () => {
  confirmAsk.value?.run?.()
  confirmAsk.value = null
}

/* ── 图标面板 ── */
const iconOpen = ref(false)

/** 选好图标就收起面板，省得再点一次 */
const onPickIcon = () => {
  w.touch()
  iconOpen.value = false
}

/* ── 站点：列表 ── */
const siteList = computed({
  get: () => activeCat.value?.sites || [],
  set: (v) => {
    if (activeCat.value) w.reorderSites(activeCat.value.id, v)
  }
})

/* ── 站点：就地编辑 ── */
const editId = ref('')
const draft = ref({ name: '', url: '', description: '', icon: '' })
const nameInputEl = ref(null)

const startEdit = async (site) => {
  if (editId.value === site.id) return
  editId.value = site.id
  draft.value = {
    name: site.name || '',
    url: site.url || '',
    description: site.description || '',
    icon: site.icon || ''
  }
  await nextTick()
  const el = Array.isArray(nameInputEl.value) ? nameInputEl.value[0] : nameInputEl.value
  el?.focus()
}

const commitEdit = (site) => {
  if (editId.value !== site.id) return
  site.name = draft.value.name.trim() || site.name
  site.url = draft.value.url.trim()
  site.description = draft.value.description.trim()
  site.icon = draft.value.icon.trim()
  editId.value = ''
  w.touch()
}

const cancelEdit = () => {
  editId.value = ''
}

const askDeleteSite = (site) => {
  confirmAsk.value = {
    title: `删除站点「${site.name}」`,
    message: '删除后无法撤销，保存到 GitHub 才会真正生效。',
    run: () => w.removeSite(props.activeId, site.id)
  }
}

/* ── 站点：快速添加 ── */
const newSiteName = ref('')

const quickAdd = () => {
  const name = newSiteName.value.trim()
  if (!name || !activeCat.value) return
  const site = w.addSite(activeCat.value.id, name)
  newSiteName.value = ''
  if (site) nextTick(() => startEdit(site))
}

const hostOf = (url) => {
  if (!url) return ''
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

/* ── 私密分类 ── */
const privateOpen = ref(false)
const privatePwd = ref('')
const privatePwd2 = ref('')
const privateErr = ref('')
const privateBusy = ref(false)
const privateTarget = computed(() => activeCat.value)

const openPrivate = () => {
  privatePwd.value = ''
  privatePwd2.value = ''
  privateErr.value = ''
  privateOpen.value = true
}

const closePrivate = () => {
  privateOpen.value = false
}

const confirmPrivate = async () => {
  privateErr.value = ''
  const p1 = privatePwd.value
  if (p1.length < 6) {
    privateErr.value = '口令至少 6 位'
    return
  }
  if (p1 !== privatePwd2.value) {
    privateErr.value = '两次输入不一致'
    return
  }
  privateBusy.value = true
  try {
    await w.markPrivate(activeCat.value.id, p1)
    privateOpen.value = false
  } catch (e) {
    privateErr.value = e.message || '加密失败'
  } finally {
    privateBusy.value = false
  }
}

const unlockOpen = ref(false)
const unlockPwd = ref('')
const unlockErr = ref('')
const unlockBusy = ref(false)

watch(unlockOpen, (v) => {
  if (v) {
    unlockPwd.value = ''
    unlockErr.value = ''
  }
})

const confirmUnlock = async () => {
  unlockErr.value = ''
  if (!unlockPwd.value) {
    unlockErr.value = '请输入口令'
    return
  }
  unlockBusy.value = true
  try {
    await w.unlock(activeCat.value.id, unlockPwd.value)
    unlockOpen.value = false
  } catch {
    unlockErr.value = '口令不对，或密文已损坏'
  } finally {
    unlockBusy.value = false
  }
}

const relockNow = () => {
  w.relock(activeCat.value.id)
}

const cancelPrivate = () => {
  try {
    w.unmarkPrivate(activeCat.value.id)
  } catch (e) {
    unlockErr.value = e.message
    unlockOpen.value = true
  }
}

const pwdOpen = ref(false)
const pwdOld = ref('')
const pwdNew = ref('')
const pwdErr = ref('')

watch(pwdOpen, (v) => {
  if (v) {
    pwdOld.value = ''
    pwdNew.value = ''
    pwdErr.value = ''
  }
})

const confirmPwd = async () => {
  pwdErr.value = ''
  try {
    await w.changePassword(activeCat.value.id, pwdOld.value, pwdNew.value)
    pwdOpen.value = false
  } catch (e) {
    pwdErr.value = e.message || '更换失败'
  }
}

</script>

<style scoped>
.ws {
  display: flex;
  gap: 18px;
  align-items: stretch;
  min-height: 0;
}

/* ── 通用按钮 ── */
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
.btn.primary {
  background: var(--accent);
  color: #fff;
}
.btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
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
  border-color: #f3d3d3;
}
.btn.danger:hover:not(:disabled) {
  background: #fdf2f2;
  border-color: #eab8b8;
}
.btn.danger-fill {
  background: #dc2626;
}
.btn.danger-fill:hover {
  background: #b91c1c;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── 左栏 ── */
.ws-side {
  width: 268px;
  align-self: stretch;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 100px);
  padding: 14px 12px 10px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.side-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px 10px;
  border-bottom: 1px solid var(--line);
}
.side-title {
  font-size: 13px;
  font-weight: 650;
  color: var(--ink-1);
  letter-spacing: 0.3px;
}
.side-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface-3);
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.side-add {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.side-add:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.cat-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.cat-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 8px 0 4px;
  border-radius: 9px;
  cursor: pointer;
  color: var(--ink-2);
  transition: background-color 0.14s ease, color 0.14s ease;
}
.cat-row:hover {
  background: var(--surface-2);
  color: var(--ink-1);
}
.cat-row.active {
  background: var(--accent-soft);
  color: var(--ink-1);
}
.cat-row.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}
.cat-row.drop-hint {
  outline: 1px dashed var(--border-strong);
  outline-offset: -1px;
}
.cat-row.over {
  background: var(--accent-soft);
  outline: 1px solid var(--accent);
}
.cat-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  color: var(--ink-3);
  opacity: 0;
  cursor: grab;
  transition: opacity 0.14s ease;
}
.cat-row:hover .cat-grip,
.cat-row.active .cat-grip {
  opacity: 1;
}
.cat-ico {
  display: flex;
  color: var(--ink-3);
}
.cat-row.active .cat-ico {
  color: var(--accent);
}
.cat-name {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-row.active .cat-name {
  font-weight: 600;
}
.cat-input {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 6px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-1);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  outline: none;
}
.cat-lock {
  color: var(--ink-3);
}
.cat-num {
  min-width: 16px;
  text-align: right;
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}
.cat-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--ink-3);
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.14s ease, color 0.14s ease, background-color 0.14s ease;
}
.cat-row:hover .cat-del {
  opacity: 1;
}
.cat-del:hover {
  color: #dc2626;
  background: #fdf2f2;
}
.side-empty {
  margin: 18px 6px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.side-tip {
  margin: 8px 6px 0;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-3);
}

/* ── 右栏 ── */
.ws-main {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 132px);
  min-width: 0;
  box-sizing: border-box;
  padding: 18px 20px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.cat-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.ch-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.ch-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--accent-soft);
  color: var(--accent);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.ch-ico:hover {
  border-color: var(--accent);
}
.ch-name {
  margin: 0 0 3px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: var(--ink-1);
}
.ch-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-3);
}
.ch-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--surface-3);
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 600;
}
.ch-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.icon-panel {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface-2);
}

.locked-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 46px 20px;
}
.lb-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 16px;
  background: var(--accent-soft);
  color: var(--accent);
}
.locked-box h3 {
  margin: 0 0 7px;
  font-size: 15.5px;
  font-weight: 650;
  color: var(--ink-1);
}
.locked-box p {
  max-width: 340px;
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-3);
}

/* ── 站点行 ── */
.site-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 6px 10px;
  padding: 14px 0 0;
}
.site-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 8px 8px 2px;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: background-color 0.14s ease, border-color 0.14s ease;
}
.site-row:hover {
  background: var(--surface-2);
}
.site-row.open {
  grid-column: 1 / -1;
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.row-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
  color: var(--ink-3);
  opacity: 0;
  cursor: grab;
  transition: opacity 0.14s ease;
}
.site-row:hover .row-grip {
  opacity: 1;
}
.row-body {
  flex: 1;
  min-width: 0;
  cursor: text;
}
.row-line {
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
}
.row-name {
  flex-shrink: 0;
  max-width: 46%;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-sep {
  flex-shrink: 0;
  color: var(--ink-3);
  font-size: 12px;
}
.row-name-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 7px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-1);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  outline: none;
}
.row-name-input:focus {
  border-color: var(--accent);
}
.row-host {
  flex-shrink: 0;
  margin-left: 4px;
  font-size: 11.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.row-desc {
  margin: 1px 0 0;
  font-size: 11.8px;
  line-height: 1.4;
  color: var(--ink-3);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}
.row-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 9px;
  background: var(--surface-2);
}
.fld {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fld > span {
  width: 62px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--ink-3);
}
.fld input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 9px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  color: var(--ink-1);
  font-family: inherit;
  font-size: 12.5px;
  outline: none;
  transition: border-color 0.14s ease;
}
.fld input:focus {
  border-color: var(--accent);
}
.row-form-actions {
  display: flex;
  gap: 7px;
  padding-left: 72px;
}
.row-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-3);
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.14s ease, color 0.14s ease, background-color 0.14s ease;
}
.site-row:hover .row-del {
  opacity: 1;
}
.row-del:hover {
  color: #dc2626;
  background: #fdf2f2;
}
.site-empty {
  margin: 26px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--ink-3);
}
.quick-add {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
  padding: 7px 9px 7px 12px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: var(--surface-2);
}
.qa-ico {
  color: var(--ink-3);
}
.qa-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--ink-1);
  font-family: inherit;
  font-size: 13px;
  outline: none;
}
.qa-input::placeholder {
  color: var(--ink-3);
}

.main-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 70px 20px;
  text-align: center;
}
.me-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 18px;
  background: var(--surface-2);
  color: var(--ink-3);
}
.main-empty h3 {
  margin: 0 0 7px;
  font-size: 16px;
  font-weight: 650;
  color: var(--ink-1);
}
.main-empty p {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--ink-3);
}

/* 拖拽幽灵 */
:deep(.drag-ghost) {
  opacity: 0.4;
  background: var(--accent-soft);
  border-radius: 10px;
}

/* 弹层内部字段 */
.md-hint {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-2);
}
.md-hint b {
  color: var(--ink-1);
}
.md-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 13px;
}
.md-field > span {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}
.md-field input {
  height: 38px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--field);
  color: var(--ink-1);
  font-family: inherit;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.md-field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  background: var(--surface);
}
.md-err {
  margin: 0 0 12px;
  padding: 8px 11px;
  border-radius: 8px;
  background: #fdf2f2;
  color: #b91c1c;
  font-size: 12.5px;
}

@media (max-width: 1024px) {
  .ws {
    flex-direction: column;
  }
  .ws-side {
    width: 100%;
    box-sizing: border-box;
  }
  .ws-side {
    position: static;
    max-height: none;
  }
  .cat-list {
    max-height: 260px;
  }
  .ch-right {
    flex-wrap: wrap;
  }
}

/* 窄屏：站点行放宽，描述换到第二行，避免被截成一个字 */
@media (max-width: 560px) {
  .site-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .ws-main {
    min-height: 0;
    padding: 14px 14px 16px;
  }
  .row-line {
    flex-wrap: wrap;
    row-gap: 2px;
  }
  .row-name {
    max-width: 100%;
  }
  .row-desc {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .site-row {
    min-height: 52px;
    padding: 8px 6px 8px 2px;
  }
}
</style>
