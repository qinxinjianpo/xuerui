/**
 * 私密分类的加密存储
 *
 * 形态：`v1.<saltB64>.<ivB64>.<密文B64>`，一个字符串就能整体随 mock_data.js 走，
 * 换设备输同一口令即可解开。口令本身不落盘、不上传、不进源码。
 *
 * 算法：PBKDF2(100000, SHA-256) 派生 256bit 密钥 → AES-256-GCM。
 * 注意：没有找回机制。口令忘了就是永久打不开，这是有意为之（服务端不存任何东西）。
 */

const VERSION = 'v1'
const ITERATIONS = 100000

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function unb64(str) {
  const s = atob(str)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** 是否是本模块产出的密文串 */
export function isSealed(value) {
  return typeof value === 'string' && value.startsWith(VERSION + '.') && value.split('.').length === 4
}

/** 加密任意可 JSON 序列化的值 */
export async function sealJson(value, password) {
  if (!password || password.length < 6) throw new Error('口令至少 6 位')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(value))
  )
  return [VERSION, b64(salt), b64(iv), b64(new Uint8Array(ct))].join('.')
}

/** 解密；口令错误会抛错（GCM 校验失败） */
export async function openSealed(payload, password) {
  if (!isSealed(payload)) throw new Error('密文格式不对')
  if (!password) throw new Error('请输入口令')
  const parts = payload.split('.')
  const salt = unb64(parts[1])
  const iv = unb64(parts[2])
  const ct = unb64(parts[3])
  const key = await deriveKey(password, salt)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return JSON.parse(dec.decode(plain))
}

/** 用某口令试解一次，只判断对不对 */
export async function verifySealed(payload, password) {
  try {
    await openSealed(payload, password)
    return true
  } catch {
    return false
  }
}
