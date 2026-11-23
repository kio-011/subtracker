import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { createHandlers, server } from './server'

// Radix UI (Select, Dialog) в jsdom требует несколько браузерных API.
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false
  window.HTMLElement.prototype.setPointerCapture = () => {}
  window.HTMLElement.prototype.releasePointerCapture = () => {}
}
window.HTMLElement.prototype.scrollIntoView ??= () => {}
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers(...createHandlers())
  localStorage.clear()
})
afterAll(() => server.close())
