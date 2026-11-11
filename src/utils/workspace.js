import { ref } from 'vue'
import { sealJson, openSealed, isSealed } from './secret.js'
import { vaultSession } from './vaultSession.js'

/** 生成短 id，避免 Date.now() 在同一毫秒内重复 */
let seq = 0
export function makeId(prefix) {
  seq = (seq + 1) % 1000
  return `${prefix}-${Date.now()}-${seq}`
}

/** 深拷贝，切断与源数据的引用，避免编辑时意外改到 props */
export const clone = (v) => JSON.parse(JSON.stringify(v))

/**
 * 分类 / 站点的编辑模型。
 *
 * 设计约定：
 * - 私密分类「已解锁」时 sites 里是明文，可以直接改；锁定时 sites 恒为 []，只能看名字
 * - 口令只存在内存（vaultSession），保存时统一重新加密，明文不进仓库
 * - 所有改动都只动内存，点「保存」才写 GitHub
 */
export function useWorkspace(initial) {
  const categories = ref(clone(initial || []))
  const dirty = ref(false)

  // 已解锁的私密分类 id 集合
  const unlocked = ref(new Set())

  const touch = () => {
    dirty.value = true
  }

  const reload = (next) => {
    categories.value = clone(next || [])
    unlocked.value = new Set()
    dirty.value = false
  }

  /* ── 排序：每次改完重排 order，避免出现空洞 ── */
  const renumber = () => {
    categories.value.forEach((c, i) => {
      c.order = i
    })
  }

  /* ── 分类 ── */
  const findCategory = (id) => categories.value.find((c) => c.id === id)

  const isLocked = (cat) => !!(cat && cat.private && isSealed(cat.lock) && !unlocked.value.has(cat.id))

  /** 站点计数：私密锁定时用 count 字段，解锁后用实际长度 */
  const siteCount = (cat) => {
    if (!cat) return 0
    if (isLocked(cat)) return Number(cat.count || 0)
    return (cat.sites || []).length
  }

  const addCategory = (name = '新分类') => {
    const cat = {
      id: makeId('category'),
      icon: 'folder',
      name,
      order: categories.value.length,
      sites: []
    }
    categories.value.push(cat)
    touch()
    return cat
  }

  const removeCategory = (id) => {
    categories.value = categories.value.filter((c) => c.id !== id)
    unlocked.value.delete(id)
    vaultSession.forget(id)
    renumber()
    touch()
  }

  /* ── 站点 ── */
  const addSite = (catId, name = '新站点') => {
    const cat = findCategory(catId)
    if (!cat || isLocked(cat)) return null
    if (!Array.isArray(cat.sites)) cat.sites = []
    const site = {
      id: makeId('site'),
      name,
      url: '',
      description: '',
      icon: ''
    }
    cat.sites.push(site)
    touch()
    return site
  }

  const removeSite = (catId, siteId) => {
    const cat = findCategory(catId)
    if (!cat || !Array.isArray(cat.sites)) return
    cat.sites = cat.sites.filter((s) => s.id !== siteId)
    touch()
  }

  /**
   * 把站点从一个分类移到另一个分类。
   * toIndex 为空时追加到末尾；为 -1 以外的数字时插入到该位置。
   */
  const moveSite = (fromCatId, toCatId, siteId, toIndex = -1) => {
    const from = findCategory(fromCatId)
    const to = findCategory(toCatId)
    if (!from || !to) return false
    if (isLocked(to)) return false

    const idx = (from.sites || []).findIndex((s) => s.id === siteId)
    if (idx === -1) return false

    const [site] = from.sites.splice(idx, 1)
    if (!Array.isArray(to.sites)) to.sites = []

    // 跨分类拖动时，目标索引要排除「源站点已被移除」造成的位置偏移（同分类内的情况）
    if (fromCatId === toCatId && toIndex > idx) toIndex -= 1
    if (toIndex < 0 || toIndex > to.sites.length) to.sites.push(site)
    else to.sites.splice(toIndex, 0, site)

    touch()
    return true
  }

  /** 同分类内重排（拖拽后调用） */
  const reorderSites = (catId, orderedSites) => {
    const cat = findCategory(catId)
    if (!cat || isLocked(cat)) return
    cat.sites = orderedSites
    touch()
  }

  /* ── 私密分类 ── */
  const markPrivate = async (catId, pwd) => {
    const cat = findCategory(catId)
    if (!cat) throw new Error('分类不存在')
    if (!pwd || pwd.length < 6) throw new Error('口令至少 6 位')

    const sites = Array.isArray(cat.sites) ? cat.sites : []
    cat.lock = await sealJson({ sites }, pwd)
    cat.private = true
    cat.count = sites.length
    // 解锁态下保留明文，方便继续编辑；最终写文件时才置空
    unlocked.value.add(cat.id)
    vaultSession.remember(cat.id, pwd)
    touch()
  }

  /** 只改密文（换口令），不动站点 */
  const changePassword = async (catId, oldPwd, newPwd) => {
    const cat = findCategory(catId)
    if (!cat) throw new Error('分类不存在')
    if (!newPwd || newPwd.length < 6) throw new Error('新口令至少 6 位')

    const pwd = oldPwd || vaultSession.get(catId)
    if (!pwd) throw new Error('请先输入原口令')

    const data = await openSealed(cat.lock, pwd)
    const sites = Array.isArray(data?.sites) ? data.sites : []
    cat.lock = await sealJson({ sites }, newPwd)
    cat.count = sites.length
    if (!unlocked.value.has(cat.id)) cat.sites = []
    vaultSession.remember(cat.id, newPwd)
    touch()
  }

  const unlock = async (catId, pwd) => {
    const cat = findCategory(catId)
    if (!cat) throw new Error('分类不存在')
    const data = await openSealed(cat.lock, pwd)
    const sites = Array.isArray(data?.sites) ? data.sites : []
    cat.sites = clone(sites)
    cat.count = sites.length
    unlocked.value.add(cat.id)
    vaultSession.remember(catId, pwd)
    return sites.length
  }

  const relock = (catId) => {
    const cat = findCategory(catId)
    if (!cat) return
    cat.sites = []
    unlocked.value.delete(catId)
    vaultSession.forget(catId)
  }

  /** 取消私密：必须已解锁，否则站点会丢 */
  const unmarkPrivate = (catId) => {
    const cat = findCategory(catId)
    if (!cat) return
    if (isSealed(cat.lock) && !unlocked.value.has(catId)) {
      throw new Error('请先解锁再取消私密，否则站点会丢失')
    }
    delete cat.private
    delete cat.lock
    delete cat.count
    unlocked.value.delete(catId)
    vaultSession.forget(catId)
    touch()
  }

  /**
   * 导出用于写文件的分类数组：
   * - 深度拷贝，不动界面数据
   * - 私密分类用会话口令重新加密并清空 sites
   * - 未解锁却没口令的，抛错拦住，避免明文进仓库
   */
  const exportCategories = async () => {
    const out = clone(categories.value)
    let sealed = 0
    for (const c of out) {
      if (!c.private) continue
      const sites = c.sites || []
      if (!sites.length) {
        c.sites = []
        if (c.count == null) c.count = 0
        continue
      }
      const pwd = vaultSession.get(c.id)
      if (!pwd) {
        throw new Error(
          `分类「${c.name}」有 ${sites.length} 个明文站点，但没有可用口令。` +
          '请重新输入口令解锁后再保存。'
        )
      }
      c.lock = await sealJson({ sites }, pwd)
      c.count = sites.length
      c.sites = []
      sealed++
    }
    return { categories: out, sealed }
  }

  return {
    categories,
    dirty,
    touch,
    reload,
    findCategory,
    isLocked,
    siteCount,
    addCategory,
    removeCategory,
    addSite,
    removeSite,
    moveSite,
    reorderSites,
    markPrivate,
    changePassword,
    unlock,
    relock,
    unmarkPrivate,
    exportCategories
  }
}
