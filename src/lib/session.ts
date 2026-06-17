'use client'

export const FREE_DAILY_LIMIT = 5

function todayKey() {
  return `rc_free_${new Date().toISOString().slice(0, 10)}`
}

export function getFreeUsed(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(todayKey()) ?? '0', 10)
}

export function incrementFreeUsed(): void {
  if (typeof window === 'undefined') return
  const key = todayKey()
  const current = parseInt(localStorage.getItem(key) ?? '0', 10)
  localStorage.setItem(key, String(current + 1))
}

export function isPaidSession(): boolean {
  if (typeof window === 'undefined') return false
  const match = document.cookie.match(/rc_pro_until=([^;]+)/)
  if (!match) return false
  try {
    return new Date(decodeURIComponent(match[1])) > new Date()
  } catch {
    return false
  }
}

export function getSession() {
  const freeUsed = getFreeUsed()
  const paid = isPaidSession()
  return {
    freeUsed,
    freeLimit: FREE_DAILY_LIMIT,
    isPaid: paid,
    canGrade: paid || freeUsed < FREE_DAILY_LIMIT,
    remaining: paid ? Infinity : Math.max(0, FREE_DAILY_LIMIT - freeUsed),
  }
}
