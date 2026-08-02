// Cloudflare Pages Function —— 服务端获取站点 favicon
//
// 浏览器只需请求同源的 /api/favicon?domain=github.com，
// 由 Cloudflare 边缘节点去目标站点「服务端」抓取真实图标再返回。
//
// 好处（针对内地网络）：
//   1. 浏览器不再直连被墙的 DuckDuckGo / Google / Bing，只跟你自己 Pages 域名通信，速度快且稳定。
//   2. 服务端只返回真正的图片字节（HTML 错误页会被过滤），不会再缓存到错乱图标。
//
// 部署：把本文件放到仓库的 `functions/api/favicon.js` 即可（与现有 functions/api/github.js 同级）。
// 不需要任何额外配置，Cloudflare Pages 会自动识别。

const ICON_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// 简单的 SSRF 防护：禁止抓取内网 / 本地地址
function isBlockedHost(host) {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h === '::1') return true
  if (h === '127.0.0.1' || h === '0.0.0.0') return true
  if (h.endsWith('.local') || h.endsWith('.internal')) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  return false
}

function guessType(u) {
  if (u.endsWith('.png')) return 'image/png'
  if (u.endsWith('.svg')) return 'image/svg+xml'
  if (u.endsWith('.gif')) return 'image/gif'
  if (u.endsWith('.webp')) return 'image/webp'
  return 'image/x-icon'
}

// 服务端抓取单个图标候选地址，成功返回 { buf, ct }，失败返回 null
async function fetchIcon(target, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(target, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': ICON_UA,
        Accept: 'image/avif,image/webp,image/png,image/svg+xml,image/x-icon,*/*;q=0.8',
      },
    })
    if (!resp.ok) return null
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    // 拒绝 HTML 错误页（被墙 / 重定向到登录页 / 默认首页等情况）
    if (ct.startsWith('text/html')) return null
    const buf = await resp.arrayBuffer()
    if (!buf || buf.byteLength < 100) return null
    return { buf, ct: ct || guessType(target) }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  let raw = (url.searchParams.get('domain') || url.searchParams.get('url') || '').trim()
  raw = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '')

  if (!raw || !raw.includes('.') || raw.includes('/') || isBlockedHost(raw)) {
    return new Response(JSON.stringify({ error: 'invalid domain' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const host = raw
  // 候选顺序：站点自带 favicon → apple-touch → Google 服务端解析（最后兜底）
  const candidates = [
    `https://${host}/favicon.ico`,
    `https://${host}/apple-touch-icon.png`,
    `https://${host}/apple-touch-icon-precomposed.png`,
    `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
  ]

  for (const c of candidates) {
    const r = await fetchIcon(c)
    if (r) {
      return new Response(r.buf, {
        status: 200,
        headers: {
          'Content-Type': r.ct,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }

  return new Response('icon not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  })
}
