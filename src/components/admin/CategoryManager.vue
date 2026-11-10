<template>
  <div class="category-manager">
    <div class="manager-header">
      <h2>📁 分类管理</h2>
      <div class="header-actions">
        <button @click="showAddModal = true" class="add-btn">
          ➕ 添加分类
        </button>
        <button @click="$emit('save')" :disabled="loading" class="save-btn">
          {{ loading ? '保存中...' : '💾 保存到GitHub' }}
        </button>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="drag-tip">
      💡 拖拽左侧 <span class="tip-handle">⋮⋮</span> 手柄可调整分类排序，点击分类卡片可进入站点管理
    </div>

    <!-- 分类列表 -->
    <div class="categories-list">
      <draggable
        v-model="localCategories"
        v-bind="dragOptions"
        @end="onDragEnd"
        item-key="id"
        tag="div"
        class="draggable-list"
      >
        <template #item="{ element: category }">
          <div
            class="category-item clickable draggable-item"
            @click="$emit('viewSites', category.id)"
          >
            <div class="category-header">
              <div class="category-info">
                <div class="drag-handle" title="拖拽排序" @click.stop>
                  ⋮⋮
                </div>
                <span class="category-icon" @click.stop="editCategory(category)" v-html="iconSvg(category.icon)"></span>
                <div class="category-details">
                  <h3 @click.stop="editCategory(category)">
                    {{ category.name }}
                    <span v-if="category.private && category.lock" class="lock-badge">🔒 已加密</span>
                  </h3>
                  <p v-if="category.private && category.lock">{{ category.count || 0 }} 个站点（已加密，不随源码公开）</p>
                  <p v-else>{{ category.sites?.length || 0 }} 个站点 → 点击查看站点管理</p>
                </div>
              </div>
              <div class="category-actions">
                <span class="order-badge">排序: {{ category.order }}</span>
                <button @click.stop="editCategory(category)" class="edit-btn">
                  ✏️ 编辑
                </button>
                <button @click.stop="deleteCategory(category.id)" class="delete-btn">
                  🗑️ 删除
                </button>
              </div>
            </div>

            <!-- 站点预览 -->
            <div class="sites-preview" v-if="category.sites && category.sites.length > 0">
              <div class="sites-grid">
                <div
                  v-for="site in category.sites.slice(0, 6)"
                  :key="site.id"
                  class="site-preview"
                >
                  <img :src="site.icon" :alt="site.name" @error="handleImageError">
                  <span>{{ site.name }}</span>
                </div>
                <div v-if="category.sites.length > 6" class="more-sites">
                  +{{ category.sites.length - 6 }} 更多
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 添加/编辑分类弹窗 -->
    <div v-if="showAddModal || editingCategory" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingCategory ? '编辑分类' : '添加分类' }}</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveCategory" class="category-form">
          <div class="form-group">
            <label>分类图标：<span class="picked-name">{{ iconLabel(formData.icon) }}</span></label>
            <div class="icon-picker">
              <template v-for="group in ICON_GROUPS" :key="group.name">
                <p class="ip-group">{{ group.name }}</p>
                <div class="ip-grid">
                  <button
                    v-for="[key, label] in group.icons"
                    :key="key"
                    type="button"
                    class="ip-cell"
                    :class="{ active: formData.icon === key }"
                    :title="label"
                    @click="formData.icon = key"
                    v-html="iconSvg(key)"
                  ></button>
                </div>
              </template>
            </div>
          </div>

          <div class="form-group">
            <label>分类名称:</label>
            <input
              v-model="formData.name"
              required
              placeholder="请输入分类名称"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>排序顺序:</label>
            <input
              v-model.number="formData.order"
              type="number"
              required
              placeholder="数字越小排序越靠前"
              class="form-input"
            >
          </div>

          <!-- 私密分类 -->
          <div class="form-group priv-block">
            <label class="priv-toggle">
              <input type="checkbox" v-model="formData.private" :disabled="isLockedEditing" />
              <span>设为私密分类（站点加密，不随源码公开）</span>
            </label>

            <div v-if="formData.private" class="priv-body">
              <p v-if="isLockedEditing" class="priv-hint unlock-hint">
                此分类已加密。要增删站点，先输原口令解锁，解锁后去「站点管理」就能看到这些站点；只改名称 / 图标 / 排序可以直接保存。
              </p>

              <div class="priv-pwd-row">
                <input
                  v-model="formData.pwd"
                  type="password"
                  :placeholder="isLockedEditing ? '输入原口令（可留空）' : '设置口令（至少 6 位）'"
                  autocomplete="new-password"
                  :disabled="unlockedOnce"
                  class="form-input"
                />
                <button
                  v-if="isLockedEditing && !unlockedOnce"
                  type="button"
                  class="unlock-inline-btn"
                  :disabled="unlocking"
                  @click="unlockForEdit"
                >{{ unlocking ? '验证中…' : '解锁' }}</button>
              </div>

              <p v-if="unlockedOnce" class="priv-hint ok-hint">
                已解锁 · 站点已恢复显示（去站点管理可增删）。保存时会用同一口令自动重新加密，不会以明文写入仓库。
              </p>
              <p v-else class="priv-hint">
                口令不保存、不上传，忘了就再也解不开。建议记在密码管理器里。
              </p>

              <p v-if="privError" class="priv-error">{{ privError }}</p>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn" :disabled="saving">
              {{ saving ? '保存中…' : (editingCategory ? '更新' : '添加') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { iconSvg, iconKey, ICON_GROUPS, ICON_LIST } from '../../utils/icons.js'
import { sealJson, openSealed, isSealed } from '../../utils/secret.js'
import { vaultSession } from '../../utils/vaultSession.js'

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'save', 'viewSites'])

// 本地分类数据
const localCategories = ref([])

// 弹窗状态
const showAddModal = ref(false)
const editingCategory = ref(null)

// 表单数据
const formData = ref({
  icon: 'folder',
  name: '',
  order: 0,
  private: false,
  pwd: ''
})

// 加密分类的编辑态：解锁后拿到站点，保存时用同一口令重新加密
const unlockedSites = ref(null)
const unlockedOnce = ref(false)
const unlocking = ref(false)
const privError = ref('')
const saving = ref(false)

const isLockedEditing = computed(
  () => !!editingCategory.value?.lock && isSealed(editingCategory.value.lock)
)

const iconLabel = (key) => ICON_LIST.find((i) => i.key === key)?.label || '文件夹'

// 监听props变化
// 与 SiteManager 同理：syncToParent 之后父组件会把同一份数据回传，
// 无条件回写会冲掉刚写进去的解锁站点，所以 emit 后跳过同批次回写。
let skipNextSync = false

watch(() => props.categories, (newCategories) => {
  if (skipNextSync) {
    skipNextSync = false
    return
  }
  localCategories.value = JSON.parse(JSON.stringify(newCategories))
}, { immediate: true, deep: true })

// 手动同步到父组件的函数，避免无限循环
const syncToParent = () => {
  skipNextSync = true
  emit('update', localCategories.value)
}

// 拖拽排序配置
const dragOptions = {
  animation: 200,
  handle: '.drag-handle',
  ghostClass: 'sortable-ghost',
  chosenClass: 'sortable-chosen',
  scroll: true,
  forceAutoScrollFallback: true,
  scrollSensitivity: 100,
  scrollSpeed: 15
}

// 拖拽结束
const onDragEnd = () => {
  // 重新排序
  localCategories.value.forEach((category, idx) => {
    category.order = idx
  })
  syncToParent()
}

// 编辑分类
const editCategory = (category) => {
  editingCategory.value = category
  formData.value = {
    icon: iconKey(category.icon),
    name: category.name,
    order: category.order,
    private: !!category.private,
    pwd: ''
  }
  unlockedSites.value = null
  unlockedOnce.value = false
  privError.value = ''
}

// 删除分类
const deleteCategory = (categoryId) => {
  if (confirm('确定要删除这个分类吗？这将同时删除分类下的所有站点。')) {
    localCategories.value = localCategories.value.filter(cat => cat.id !== categoryId)
    syncToParent()
  }
}

// 保存分类
const saveCategory = async () => {
  privError.value = ''

  const editing = editingCategory.value
  let target
  if (editing) {
    const idx = localCategories.value.findIndex((cat) => cat.id === editing.id)
    target = { ...localCategories.value[idx] }
  } else {
    target = { id: `category-${Date.now()}`, sites: [] }
  }

  target.icon = formData.value.icon || 'folder'
  target.name = formData.value.name
  target.order = formData.value.order

  if (formData.value.private) {
    target.private = true

    // 已解锁 → 用解出来的站点；否则沿用现有站点（新分类为空）
    const sites = unlockedSites.value !== null ? unlockedSites.value : (target.sites || [])

    if (formData.value.pwd) {
      if (formData.value.pwd.length < 6) {
        privError.value = '口令至少 6 位'
        return
      }
      saving.value = true
      try {
        target.lock = await sealJson({ sites }, formData.value.pwd)
        target.count = sites.length
        // 已解锁的不用清空：内存里留着明文，站点管理才能继续编辑，
        // 最终写文件时由 AdminView.saveToGitHub 统一加密并置空。
        if (unlockedSites.value === null) target.sites = []
        else target.sites = JSON.parse(JSON.stringify(sites))
      } catch (e) {
        privError.value = e.message || '加密失败'
        return
      } finally {
        saving.value = false
      }
    } else if (target.lock) {
      // 只改了名字/图标/排序：密文里只存站点，不需要重新加密
      if (unlockedSites.value !== null) {
        privError.value = '已解锁但没填口令，无法重新加密。请填写口令后再保存。'
        return
      }
    } else {
      privError.value = '设为私密必须设置口令'
      return
    }
  } else {
    // 取消私密：必须已解锁，否则站点会丢
    if (target.lock) {
      if (unlockedSites.value === null) {
        privError.value = '取消私密需要先输入原口令解锁，否则站点内容会丢失'
        return
      }
      target.sites = unlockedSites.value
    }
    delete target.private
    delete target.lock
    delete target.count
    vaultSession.forget(target.id)
  }

  if (editing) {
    const idx = localCategories.value.findIndex((cat) => cat.id === editing.id)
    if (idx !== -1) localCategories.value[idx] = target
  } else {
    localCategories.value.push(target)
  }

  syncToParent()
  closeModal()
}

// 编辑已加密分类时，先用原口令把站点解出来
const unlockForEdit = async () => {
  const cat = editingCategory.value
  if (!cat || !formData.value.pwd) {
    privError.value = '请输入这个分类的原口令'
    return
  }
  unlocking.value = true
  privError.value = ''
  try {
    const data = await openSealed(cat.lock, formData.value.pwd)
    const sites = Array.isArray(data?.sites) ? data.sites : []
    unlockedSites.value = sites
    unlockedOnce.value = true

    // 记住口令 + 把站点写回列表，站点管理页就能直接增删
    vaultSession.remember(cat.id, formData.value.pwd)
    const idx = localCategories.value.findIndex((c) => c.id === cat.id)
    if (idx !== -1) {
      localCategories.value[idx].sites = JSON.parse(JSON.stringify(sites))
      // 同步一次，让「站点管理」tab 拿到解锁后的站点
      syncToParent()
    }
  } catch {
    privError.value = '口令不对，或者密文已损坏'
  } finally {
    unlocking.value = false
  }
}

// 关闭弹窗
const closeModal = () => {
  showAddModal.value = false
  editingCategory.value = null
  formData.value = {
    icon: 'folder',
    name: '',
    order: localCategories.value.length,
    private: false,
    pwd: ''
  }
  unlockedSites.value = null
  unlockedOnce.value = false
  privError.value = ''
  saving.value = false
}

// 处理图片错误
const handleImageError = (event) => {
  // 设置默认的 favicon.ico 作为 fallback 图片
  event.target.src = '/favicon.ico'
  event.target.onerror = null // 防止无限循环
}
</script>

<style scoped>
.category-manager {
  padding: 20px 0;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.manager-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 24px;
}

.drag-tip {
  background: #ebf5fb;
  border: 1px solid #aed6f1;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 20px;
  color: #2980b9;
  font-size: 14px;
}

.tip-handle {
  display: inline-block;
  background: #d5e8f5;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: bold;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.add-btn, .save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn {
  background: #27ae60;
  color: white;
}

.add-btn:hover {
  background: #219a52;
}

.save-btn {
  background: #3498db;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #2980b9;
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.category-item.clickable {
  cursor: pointer;
}

.category-item.clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #f1f3f4;
  border-color: #3498db;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-icon {
  font-size: 32px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.category-icon:hover {
  background: rgba(52, 152, 219, 0.1);
}

.category-details h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  cursor: pointer;
  transition: color 0.3s ease;
}

.category-details h3:hover {
  color: #3498db;
}

.category-details p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-badge {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.drag-handle {
  cursor: grab;
  font-size: 18px;
  color: #95a5a6;
  user-select: none;
  padding: 5px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  line-height: 1;
}

.drag-handle:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

.drag-handle:active {
  cursor: grabbing;
}

.sortable-ghost {
  opacity: 0.4;
  border: 2px dashed #3498db !important;
  background: #ebf5fb !important;
}

.sortable-chosen {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: rotate(1deg);
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.edit-btn:hover {
  background: #e67e22;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

.sites-preview {
  margin-top: 15px;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.site-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.site-preview img {
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
  object-fit: contain;
}

.site-preview span {
  font-size: 12px;
  color: #7f8c8d;
  text-align: center;
  line-height: 1.2;
}

.more-sites {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: #ecf0f1;
  border-radius: 6px;
  color: #7f8c8d;
  font-size: 12px;
  font-weight: 500;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background: #f8f9fa;
}

.category-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #e1e1e1;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.icon-input {
  position: relative;
}

.icon-preview {
  font-size: 20px;
  text-align: center;
}

.emoji-suggestions {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.emoji-item:hover {
  background: #3498db;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.cancel-btn, .submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.submit-btn {
  background: #27ae60;
  color: white;
}

.submit-btn:hover {
  background: #219a52;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .category-actions {
    flex-wrap: wrap;
  }

  .sites-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

/* ── 图标选择器 ── */
.picked-name {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #3498db;
}
.icon-picker {
  max-height: 236px;
  overflow-y: auto;
  padding: 10px 12px 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}
.ip-group {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 10px -2px 5px;
  padding: 3px 2px;
  background: #f8f9fa;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .3px;
  color: #95a5a6;
}
.ip-group:first-child {
  margin-top: 0;
}
.ip-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
}
.ip-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: #fff;
  color: #4a5b6b;
  cursor: pointer;
  transition: border-color .15s ease, background-color .15s ease, color .15s ease;
}
.ip-cell :deep(svg) {
  width: 18px;
  height: 18px;
}
.ip-cell :deep(.soft) {
  opacity: .45;
}
.ip-cell:hover {
  border-color: #aed6f1;
  background: #ebf5fb;
  color: #2980b9;
}
.ip-cell.active {
  border-color: #3498db;
  background: #ebf5fb;
  color: #2980b9;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, .16);
}

/* ── 列表里的加密徽标 ── */
.lock-badge {
  margin-left: 7px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #fdf3e3;
  border: 1px solid #f0d9a8;
  color: #a9761b;
  font-size: 11px;
  font-weight: 500;
  vertical-align: middle;
}

/* ── 私密分类表单 ── */
.priv-block {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px dashed #e2e6ea;
}
.priv-toggle {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
}
.priv-toggle input {
  width: 16px;
  height: 16px;
  accent-color: #3498db;
  cursor: pointer;
}
.priv-body {
  margin-top: 11px;
  padding: 12px 13px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}
.priv-pwd-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.priv-pwd-row .form-input {
  flex: 1;
  margin: 0;
}
.unlock-inline-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background: #3498db;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color .2s ease;
}
.unlock-inline-btn:hover:not(:disabled) {
  background: #2980b9;
}
.unlock-inline-btn:disabled {
  background: #bdc3c7;
  cursor: default;
}
.priv-hint {
  margin: 9px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: #7f8c8d;
}
.priv-hint.unlock-hint {
  margin: 0 0 10px;
  color: #a9761b;
}
.priv-hint.ok-hint {
  color: #27ae60;
  font-weight: 500;
}
.priv-error {
  margin: 9px 0 0;
  font-size: 12.5px;
  color: #e74c3c;
}
</style>
