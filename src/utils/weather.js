/**
 * 顶栏天气：Open-Meteo 免费接口，无需 Key、不限额度、不追踪。
 * 默认坐标固定为襄阳市襄州区，不调用浏览器定位（避免弹权限、也不上报位置）。
 */

export const WEATHER_LOCATION = {
  name: '襄州',
  latitude: 32.0876,
  longitude: 112.2118,
  timezone: 'Asia/Shanghai'
}

const CACHE_KEY = 'nav_weather_v1'
const CACHE_TTL = 30 * 60 * 1000 // 30 分钟，够用且不浪费请求

/** WMO 天气码 → 归类 */
function codeKind(code, isDay = 1) {
  if (code === 0) return isDay ? 'sun' : 'night'
  if (code === 1) return isDay ? 'partly' : 'night'
  if (code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  return 'cloud'
}

/** WMO 天气码 → 中文 */
function codeText(code) {
  const map = {
    0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
    45: '雾', 48: '雾凇',
    51: '小毛雨', 53: '毛毛雨', 55: '密毛雨',
    56: '冻毛雨', 57: '冻毛雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '冻雨',
    71: '小雪', 73: '中雪', 75: '大雪', 77: '米雪',
    80: '阵雨', 81: '强阵雨', 82: '暴雨',
    85: '阵雪', 86: '强阵雪',
    95: '雷阵雨', 96: '雷暴冰雹', 99: '强雷暴冰雹'
  }
  return map[code] || '多云'
}

/* 与分类图标同一套风格：24 网格、细描边、圆头 */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'

export const WEATHER_SVG = {
  sun: `<svg viewBox="0 0 24 24" ${STROKE}><circle cx="12" cy="12" r="4.1"/><path d="M12 2.8v2.3M12 18.9v2.3M2.8 12h2.3M18.9 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/></svg>`,
  night: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M20.2 15.1A8.3 8.3 0 019.4 4.3a8.4 8.4 0 1010.8 10.8z"/><path d="M16.6 3.4l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/></svg>`,
  partly: `<svg viewBox="0 0 24 24" ${STROKE}><circle cx="8.6" cy="8.4" r="3.3"/><path d="M8.6 2.9v1.7M3.1 8.4h1.7M4.7 4.5l1.2 1.2M12.5 4.5l-1.2 1.2"/><path d="M9.6 19.6h7.2a3.1 3.1 0 00.4-6.18 4.75 4.75 0 00-8.92 1.1 2.55 2.55 0 001.32 5.08z"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M7.4 18.7h9.2a3.85 3.85 0 00.54-7.66 6 6 0 00-11.2 1.5 3.2 3.2 0 001.46 6.16z"/></svg>`,
  fog: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M7.4 15.4h9.2a3.6 3.6 0 00.5-7.16 5.7 5.7 0 00-10.65 1.42 3 3 0 00.95 5.74z"/><path d="M4.6 19h14.8"/></svg>`,
  drizzle: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M7.4 14.9h9.2a3.6 3.6 0 00.5-7.16 5.7 5.7 0 00-10.65 1.42 3 3 0 00.95 5.74z"/><path d="M9.4 18.2l-.7 2M14.6 18.2l-.7 2"/></svg>`,
  rain: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M7.4 14.4h9.2a3.6 3.6 0 00.5-7.16 5.7 5.7 0 00-10.65 1.42 3 3 0 00.95 5.74z"/><path d="M8.8 17.4l-1.1 3.1M12.9 17.4l-1.1 3.1M17 17.4l-1.1 3.1"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M7.4 14.4h9.2a3.6 3.6 0 00.5-7.16 5.7 5.7 0 00-10.65 1.42 3 3 0 00.95 5.74z"/><path d="M8.6 17.9h.01M12 20.4h.01M15.4 17.9h.01M12 17.2h.01"/></svg>`,
  thunder: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M7.4 14.4h9.2a3.6 3.6 0 00.5-7.16 5.7 5.7 0 00-10.65 1.42 3 3 0 00.95 5.74z"/><path d="M12.6 16.6l-2.3 3.4h3.1l-1.5 2.4"/></svg>`
}

export function weatherIcon(code, isDay) {
  return WEATHER_SVG[codeKind(code, isDay)] || WEATHER_SVG.cloud
}

export function weatherText(code) {
  return codeText(code)
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || !obj.t || Date.now() - obj.t > CACHE_TTL) return null
    return obj.data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }))
  } catch {
    /* 隐私模式 / 配额满，忽略即可 */
  }
}

/**
 * 拉取当前天气。失败返回 null（调用方只显示时间，不显示错误提示）。
 * @param {boolean} force 忽略缓存
 */
export async function fetchWeather(force = false) {
  if (!force) {
    const cached = readCache()
    if (cached) return cached
  }

  const { latitude, longitude, timezone } = WEATHER_LOCATION
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
    '&daily=temperature_2m_max,temperature_2m_min&timezone=' +
    encodeURIComponent(timezone) +
    '&forecast_days=1'

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const json = await res.json()
    const cur = json?.current
    if (!cur || typeof cur.temperature_2m !== 'number') return null

    const data = {
      temp: Math.round(cur.temperature_2m),
      feels: Math.round(cur.apparent_temperature),
      humidity: Math.round(cur.relative_humidity_2m),
      wind: Math.round(cur.wind_speed_10m),
      code: cur.weather_code,
      isDay: cur.is_day,
      high: Math.round(json?.daily?.temperature_2m_max?.[0] ?? cur.temperature_2m),
      low: Math.round(json?.daily?.temperature_2m_min?.[0] ?? cur.temperature_2m)
    }
    writeCache(data)
    return data
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
