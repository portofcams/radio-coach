import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const COOKIE = 'rc_auth'
const EXPIRY = 60 * 60 * 24 * 30 // 30 days in seconds

function secret(): string {
  return process.env.JWT_SECRET ?? 'dev-secret-change-in-prod'
}

export interface JWTPayload {
  userId: number
  email: string
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, secret()) as JWTPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(payload: JWTPayload): Promise<void> {
  const token = signToken(payload)
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRY,
    path: '/',
  })
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export { toPhonetic } from './phonetic'
