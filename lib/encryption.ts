import crypto from 'crypto'

// Encryption key - in production, this should come from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'todo-trinity-default-encryption-key-32-chars'

if (ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters long')
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (string or object)
 * @returns Object containing iv, encryptedData, and tag
 */
export function encrypt(data: string | Record<string, any>): {
  iv: string
  encryptedData: string
  tag: string
} {
  const iv = crypto.randomBytes(12) // GCM recommended IV length
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv)

  const input = typeof data === 'string' ? data : JSON.stringify(data)
  let encrypted = cipher.update(input, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag: tag.toString('hex')
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Object containing iv, encryptedData, and tag
 * @returns Decrypted string (or parsed object if original was JSON)
 */
export function decrypt(encryptedData: {
  iv: string
  encryptedData: string
  tag: string
}): string | Record<string, any> {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(encryptedData.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))

  let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  // Try to parse as JSON, return as string if invalid JSON
  try {
    return JSON.parse(decrypted)
  } catch {
    return decrypted
  }
}

/**
 * Hash data using SHA-256
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate secure random token
 * @param length - Length of token in bytes (default 32)
 * @returns Hex-encoded random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Compare two values in constant time to prevent timing attacks
 * @param a - First value
 * @param b - Second value
 * @returns boolean indicating if values are equal
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}