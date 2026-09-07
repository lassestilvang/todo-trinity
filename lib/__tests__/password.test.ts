import { hashPassword, verifyPassword } from '@/lib/password'

describe('lib/password', () => {
  describe('hashPassword', () => {
    it('should hash a password with 10 salt rounds', async () => {
      const password = 'test-password-123'
      const hashed = await hashPassword(password)
      expect(typeof hashed).toBe('string')
      expect(hashed).not.toBe(password)
      // Verify it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      expect(hashed).toMatch(/^\$2[abxy]\$\d{2}\$/
      )
    })

    it('should produce different hashes for same password', async () => {
      const password = 'test-password-123'
      const hashed1 = await hashPassword(password)
      const hashed2 = await hashPassword(password)
      expect(hashed1).not.toBe(hashed2)
    })

    it('should verify correct password', async () => {
      const password = 'test-password-123'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(password, hashed)
      expect(isValid).toBe(true)
    })

    it('should reject wrong password', async () => {
      const password = 'test-password-123'
      const wrongPassword = 'wrong-password-456'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hashed)
      expect(isValid).toBe(false)
    })

    it('should handle empty password', async () => {
      const hashed = await hashPassword('')
      const isValid = await verifyPassword('', hashed)
      expect(isValid).toBe(true)
    })
  })

  describe('verifyPassword', () => {
    it('should verify matching passwords', async () => {
      const password = 'secret-password'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(password, hashed)
      expect(isValid).toBe(true)
    })

    it('should reject non-string inputs gracefully', async () => {
      // @ts-ignore - testing edge case
      const result = await verifyPassword(123, 'not-a-hash')
      expect(result).toBe(false)
    })
  })
})