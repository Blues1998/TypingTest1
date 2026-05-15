import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

const base = 'http://localhost:5173/TypingTest1'

await mkdir('screenshots', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

const screens = [
  ['/', '01-home'],
  ['/type/stopwatch', '02-typing-stopwatch'],
  ['/type/countdown', '03-typing-countdown'],
  ['/bubble', '04-bubble'],
  ['/leaderboard', '05-leaderboard'],
  ['/history', '06-history'],
]

for (const [path, name] of screens) {
  await page.goto(base + path)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false })
  console.log(`captured: screenshots/${name}.png`)
}

await browser.close()
console.log('done')
