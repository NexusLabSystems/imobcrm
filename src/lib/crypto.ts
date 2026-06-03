import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv  = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // formato: iv (16) + tag (16) + encrypted
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(data: string): string {
  const buf       = Buffer.from(data, 'base64')
  const iv        = buf.subarray(0, 16)
  const tag       = buf.subarray(16, 32)
  const encrypted = buf.subarray(32)
  const decipher  = createDecipheriv('aes-256-gcm', KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}

// Tenta decriptar — retorna null se o dado não estiver criptografado ou for inválido
export function safeDecrypt(data: string | null): string | null {
  if (!data) return null
  try { return decrypt(data) } catch { return null }
}

// Mascarar CPF: 123.456.789-09 → ***.456.789-**
export function maskCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return '***.***.***-**'
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
}
