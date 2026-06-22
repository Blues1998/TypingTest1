function generateResultSvg(results, mode, difficulty, isDark) {
  const bg     = isDark ? '#1a1a1a' : '#ffffff'
  const fg     = isDark ? '#d1d1d1' : '#1a1a1a'
  const main   = isDark ? '#e2b714' : '#c49a00'
  const sub    = isDark ? '#777777' : '#888888'
  const border = isDark ? '#2a2a2a' : '#e0e0e0'
  const W = 520, H = 220

  const rows = [
    `<rect width="${W}" height="${H}" fill="${bg}" rx="12"/>`,
    `<rect x="1" y="1" width="${W-2}" height="${H-2}" fill="none" stroke="${border}" stroke-width="1" rx="11"/>`,
    `<text x="20" y="32" fill="${main}" font-family="monospace" font-size="13" font-weight="bold">typetest</text>`,
    `<text x="20" y="110" fill="${main}" font-family="monospace" font-size="70" font-weight="bold">${results.wpm}</text>`,
    `<text x="20" y="132" fill="${sub}" font-family="monospace" font-size="13">wpm</text>`,
    `<text x="195" y="100" fill="${fg}" font-family="monospace" font-size="44" font-weight="bold">${results.accuracy}%</text>`,
    `<text x="195" y="120" fill="${sub}" font-family="monospace" font-size="12">accuracy</text>`,
  ]

  if (results.consistency != null) {
    rows.push(`<text x="365" y="100" fill="${fg}" font-family="monospace" font-size="44" font-weight="bold">${results.consistency}%</text>`)
    rows.push(`<text x="365" y="120" fill="${sub}" font-family="monospace" font-size="12">consistency</text>`)
  }

  const meta = `${mode}${difficulty && difficulty !== mode ? ' · ' + difficulty : ''} · ${results.time}s`
  rows.push(`<text x="20" y="${H - 18}" fill="${sub}" font-family="monospace" font-size="11">${meta}</text>`)

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rows.join('')}</svg>`
}

export function downloadResultsImage(results, mode, difficulty, isDark) {
  const svg = generateResultSvg(results, mode, difficulty, isDark)
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const svgUrl = URL.createObjectURL(blob)

  const img = new Image()
  img.onload = () => {
    const W = 520, H = 220
    const canvas = document.createElement('canvas')
    canvas.width = W * 2
    canvas.height = H * 2
    const ctx = canvas.getContext('2d')
    ctx.scale(2, 2)
    ctx.drawImage(img, 0, 0)
    canvas.toBlob(pngBlob => {
      const url = URL.createObjectURL(pngBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `typetest-${results.wpm}wpm.png`
      a.click()
      URL.revokeObjectURL(url)
      URL.revokeObjectURL(svgUrl)
    })
  }
  img.src = svgUrl
}
