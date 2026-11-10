/**
 * 每日一句：从一言（hitokoto）取诗句。
 *
 * - 只取「诗词」类（c=i），保证调性和站的风格一致
 * - 5 秒超时，失败 / 断网 / 接口挂掉时退回内置兜底句，侧边栏不会出现空白块
 * - 不做缓存：每次进站（或点「换一句」）都是一句新的
 */

const ENDPOINT = 'https://v1.hitokoto.cn/?c=i&encode=json'
const TIMEOUT = 5000

// 兜底句：接口不通时至少还有一句可看
export const FALLBACKS = [
  { text: '愿逐月华流照君。', from: '张若虚《春江花月夜》' },
  { text: '山中何事？松花酿酒，春水煎茶。', from: '张可久《人月圆》' },
  { text: '人生如逆旅，我亦是行人。', from: '苏轼《临江仙》' },
  { text: '醉后不知天在水，满船清梦压星河。', from: '唐珙《题龙阳县青草湖》' },
  { text: '我见青山多妩媚，料青山见我应如是。', from: '辛弃疾《贺新郎》' }
]

export const FALLBACK_QUOTE = FALLBACKS[0]

/** 随机取一句兜底，尽量避免和当前这句重复 */
export function pickFallback(exclude = '') {
  const pool = FALLBACKS.filter((q) => q.text !== exclude)
  const list = pool.length ? pool : FALLBACKS
  return list[Math.floor(Math.random() * list.length)]
}

/** 拼出处：`屈原《离骚》` / 只有书名时 `《离骚》` / 都没有时空串 */
function formatFrom(from, who) {
  const title = (from || '').trim()
  const author = (who || '').trim()
  if (!title) return author
  if (!author) return `《${title}》`
  // 有些条目的 from 已经是《书名》格式，避免出现《《书名》》
  return title.startsWith('《') ? `${author}${title}` : `${author}《${title}》`
}

/**
 * 取一句。
 * 永远 resolve，不会 reject：拿不到就返回兜底句，调用方不用写 catch。
 * 若返回的和 exclude 相同（一言偶尔连续给同一条），自动重试一次。
 */
export async function fetchQuote(exclude = '', retry = 1) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const res = await fetch(ENDPOINT, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const text = String(data?.hitokoto || '').trim()
    if (!text) throw new Error('empty')

    // 太短没味道，太长会被侧边栏截断，都不合适
    const badLength = text.length < 6 || text.length > 42
    if ((badLength || text === exclude) && retry > 0) {
      clearTimeout(timer)
      return fetchQuote(exclude, retry - 1)
    }

    return {
      text,
      from: formatFrom(data?.from, data?.from_who),
      online: true
    }
  } catch {
    const fb = pickFallback(exclude)
    return { ...fb, online: false }
  } finally {
    clearTimeout(timer)
  }
}
