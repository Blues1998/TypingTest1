// Format elapsed seconds as "S.Ds" with a single decimal (tenths), e.g. 12.3s.
export function formatElapsed(elapsed) {
  const secs = Math.floor(elapsed)
  const tenths = Math.floor((elapsed % 1) * 10)
  return `${secs}.${tenths}s`
}
