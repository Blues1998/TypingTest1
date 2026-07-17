import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { downloadResultsImage } from '../../utils/shareUtils.js'

// jsdom has no real canvas / image decoding, so we stub the browser APIs the
// helper relies on and capture what it produces.

let createdBlobs
let pngBlob
let anchor
let realCreateElement

function installStubs() {
  createdBlobs = []
  pngBlob = new Blob(['png'], { type: 'image/png' })

  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
    createdBlobs.push(blob)
    return `blob:mock/${createdBlobs.length}`
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  // Fire onload synchronously when src is assigned.
  globalThis.Image = class {
    set src(_value) {
      if (typeof this.onload === 'function') this.onload()
    }
  }

  const ctx = { scale: vi.fn(), drawImage: vi.fn() }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(cb => cb(pngBlob))

  // Capture the anchor the helper creates for the download.
  realCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(tag => {
    const el = realCreateElement(tag)
    if (tag === 'a') {
      anchor = el
      el.click = vi.fn()
    }
    return el
  })
}

const results = { wpm: 88, accuracy: 97, consistency: 91, time: 30 }

describe('shareUtils — downloadResultsImage', () => {
  beforeEach(installStubs)
  afterEach(() => vi.restoreAllMocks())

  it('creates an object URL from an SVG blob', () => {
    downloadResultsImage(results, 'stopwatch', 'standard', true)
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(createdBlobs[0].type).toBe('image/svg+xml')
  })

  it('renders the canvas at 2x scale', () => {
    downloadResultsImage(results, 'stopwatch', 'standard', true)
    const ctx = HTMLCanvasElement.prototype.getContext.mock.results[0].value
    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
    expect(ctx.drawImage).toHaveBeenCalled()
  })

  it('triggers a download named after the WPM', () => {
    downloadResultsImage(results, 'stopwatch', 'standard', true)
    expect(anchor.download).toBe('typetest-88wpm.png')
    expect(anchor.href).toContain('blob:mock/')
    expect(anchor.click).toHaveBeenCalledTimes(1)
  })

  it('revokes both the svg and png object URLs', () => {
    downloadResultsImage(results, 'stopwatch', 'standard', true)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('works when consistency is absent', () => {
    const noConsistency = { wpm: 50, accuracy: 90, consistency: null, time: 15 }
    expect(() =>
      downloadResultsImage(noConsistency, 'countdown', 'standard', false)
    ).not.toThrow()
    expect(anchor.download).toBe('typetest-50wpm.png')
  })
})
