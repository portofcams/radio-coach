import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies, headers } from 'next/headers'

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

export async function setAuthCookie(payload: JWTPayload): Promise<string> {
  const token = signToken(payload)
  const store = await cookies()
  const production = process.env.NODE_ENV === 'production'
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    maxAge: EXPIRY,
    path: '/',
  })
  return token
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const store = await cookies()
  const cookieToken = store.get(COOKIE)?.value
  if (cookieToken) {
    const payload = verifyToken(cookieToken)
    if (payload) return payload
  }
  // Native Swift client sends the token from signup/login's response body
  // instead of relying on a cookie jar.
  const auth = (await headers()).get('authorization')
  if (auth?.startsWith('Bearer ')) return verifyToken(auth.slice(7))
  return null
}

export { toPhonetic } from './phonetic'
