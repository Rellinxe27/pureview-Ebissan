import { describe, it, expect } from 'vitest'
import { formatToastMessage } from '../utils/toast'

describe('formatToastMessage', () => {
  it('formats a single-word label', () => {
    expect(formatToastMessage('Calendar')).toBe('Calendar — Coming Soon')
  })

  it('formats a multi-word label', () => {
    expect(formatToastMessage('New Appointment')).toBe('New Appointment — Coming Soon')
    expect(formatToastMessage('Recurring Services')).toBe('Recurring Services — Coming Soon')
  })

  it('uses an em dash separator', () => {
    const result = formatToastMessage('Invoices')
    expect(result).toContain('—')
    expect(result).toContain('Coming Soon')
  })

  it('preserves the label exactly', () => {
    const label = 'Proposals / Quotes'
    const result = formatToastMessage(label)
    expect(result.startsWith(label)).toBe(true)
  })
})
