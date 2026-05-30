import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  // Ensure we have exactly 32 bytes for AES-256
  const keyBuffer = Buffer.from(key, 'hex')
  if (keyBuffer.length !== 32) {
    // Fallback: hash the key to get 32 bytes
    return crypto.createHash('sha256').update(key).digest()
  }
  return keyBuffer
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Returns a string in the format: iv:encryptedData (both hex-encoded)
 */
export function encrypt(text: string): string {
  try {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return `${iv.toString('hex')}:${encrypted}`
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypts a string that was encrypted with the encrypt() function.
 * Expects input in the format: iv:encryptedData (both hex-encoded)
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getKey()
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Checks if a string is in encrypted format (iv:data)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':')
  if (parts.length !== 2) return false
  // Check if both parts are valid hex strings
  const hexRegex = /^[0-9a-fA-F]+$/
  return hexRegex.test(parts[0]) && hexRegex.test(parts[1]) && parts[0].length === IV_LENGTH * 2
}
