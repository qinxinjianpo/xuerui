/**
 * 后台编辑私密分类时的口令暂存
 *
 * 只放在内存里，刷新 / 关页面就没了。用途是：解锁后把站点还原到内存好编辑，
 * 保存时再用同一个口令自动加密回去，不用让用户输两遍。
 *
 * 注意：这里存的只是「本次会话用过的口令」，不会进源码、不进 localStorage。
 */
const pwds = new Map()

export const vaultSession = {
  remember(catId, pwd) {
    if (catId && pwd) pwds.set(catId, pwd)
  },
  get(catId) {
    return pwds.get(catId) || ''
  },
  has(catId) {
    return pwds.has(catId)
  },
  forget(catId) {
    pwds.delete(catId)
  },
  ids() {
    return [...pwds.keys()]
  }
}
