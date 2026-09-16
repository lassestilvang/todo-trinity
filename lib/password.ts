import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
    return false
  }
  return bcrypt.compare(password, hashedPassword)
}