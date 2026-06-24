import { describe, it, expect } from 'vitest'
import { validateLoginForm, getAuthRedirect } from '../utils/auth'

describe('validateLoginForm', () => {
  it('returns error for empty email', () => {
    expect(validateLoginForm('', 'password123')).toBe('Email is required.')
  })

  it('returns error for whitespace-only email', () => {
    expect(validateLoginForm('   ', 'password123')).toBe('Email is required.')
  })

  it('returns error for invalid email format', () => {
    expect(validateLoginForm('notanemail', 'password123')).toBe('Please enter a valid email address.')
    expect(validateLoginForm('missing@domain', 'password123')).toBe('Please enter a valid email address.')
  })

  it('returns error for empty password', () => {
    expect(validateLoginForm('user@example.com', '')).toBe('Password is required.')
  })

  it('returns null for valid credentials', () => {
    expect(validateLoginForm('user@example.com', 'password123')).toBeNull()
  })

  it('trims email whitespace before validating', () => {
    expect(validateLoginForm('  user@example.com  ', 'password123')).toBeNull()
  })

  it('validates email before checking password', () => {
    const result = validateLoginForm('bad-email', '')
    expect(result).toBe('Please enter a valid email address.')
  })
})

describe('getAuthRedirect', () => {
  it('redirects logged-in user away from login page to dashboard', () => {
    expect(getAuthRedirect('/login', true)).toBe('/')
  })

  it('allows unauthenticated user to stay on login page', () => {
    expect(getAuthRedirect('/login', false)).toBeNull()
  })

  it('allows authenticated user to access any page', () => {
    expect(getAuthRedirect('/', true)).toBeNull()
    expect(getAuthRedirect('/calendar', true)).toBeNull()
    expect(getAuthRedirect('/settings', true)).toBeNull()
  })

  it('redirects unauthenticated user from any page to login', () => {
    expect(getAuthRedirect('/', false)).toBe('/login')
    expect(getAuthRedirect('/calendar', false)).toBe('/login')
    expect(getAuthRedirect('/settings', false)).toBe('/login')
  })
})
