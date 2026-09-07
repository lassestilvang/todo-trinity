import { formatDate, formatDateTime, priorityOrder, getInitials, truncateString } from '@/lib/utils'

describe('lib/utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-10-10T14:30:00Z')
      expect(formatDate(date)).toBe('Oct 10, 2026')
    })

    it('should handle invalid dates', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
    })

    it('should handle null/undefined', () => {
      // @ts-ignore - testing invalid input
      expect(formatDate(null)).toBe('Invalid Date')
      // @ts-ignore - testing invalid input
      expect(formatDate(undefined)).toBe('Invalid Date')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const date = new Date('2026-10-10T14:30:00Z')
      expect(formatDateTime(date)).toBe('Oct 10, 2026, 2:30 PM')
    })

    it('should handle invalid dates', () => {
      expect(formatDateTime(new Date('invalid'))).toBe('Invalid Date')
    })
  })

  describe('priorityOrder', () => {
    it('should have correct priority values', () => {
      expect(priorityOrder.Low).toBe(1)
      expect(priorityOrder.Medium).toBe(2)
      expect(priorityOrder.High).toBe(3)
      expect(priorityOrder.Urgent).toBe(4)
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Smith')).toBe('JS')
      expect(getInitials('A B C')).toBe('ABC')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('')
    })
  })

  describe('truncateString', () => {
    it('should truncate long strings', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello...')
      expect(truncateString('Hello World', 3)).toBe('Hel...')
    })

    it('should return original string if shorter than limit', () => {
      expect(truncateString('Hi', 10)).toBe('Hi')
    })

    it('should handle exact length', () => {
      expect(truncateString('Hello', 5)).toBe('Hello')
    })

    it('should handle zero length', () => {
      expect(truncateString('Hello', 0)).toBe('')
    })

    it('should handle negative length', () => {
      expect(truncateString('Hello', -1)).toBe('')
    })
  })
})