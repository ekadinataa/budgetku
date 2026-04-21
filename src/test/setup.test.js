import { describe, it, expect } from 'vitest'

describe('Project setup', () => {
  it('vitest is configured and running', () => {
    expect(true).toBe(true)
  })

  it('jsdom environment is available', () => {
    expect(typeof document).toBe('object')
    expect(typeof window).toBe('object')
  })
})
