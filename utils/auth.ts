const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.'
  if (!password) return 'Password is required.'
  return null
}

export function getAuthRedirect(path: string, isLoggedIn: boolean): string | null {
  if (path === '/login') return isLoggedIn ? '/' : null
  return isLoggedIn ? null : '/login'
}
