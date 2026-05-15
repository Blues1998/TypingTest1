import '@testing-library/jest-dom'

// Minimal localStorage mock — jsdom provides a real one, but
// we call clear() in beforeEach to keep tests isolated.

// Silence framer-motion errors in test environment
window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener: () => {}, removeListener: () => {} }
}

// IntersectionObserver stub (used by some Recharts internals)
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ResizeObserver stub
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
