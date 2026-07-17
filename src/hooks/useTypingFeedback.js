import { useAnimation } from 'framer-motion'
import { useSound } from './useSound.js'

// Shared click/error audio + shake feedback for the typing input surfaces.
// `reactToInput` inspects a freshly-typed character (if the value grew) and
// plays the matching sound / triggers the shake; `shakeControls` is bound to
// the animated wrapper around the character display.
export function useTypingFeedback() {
  const { playClick, playError } = useSound()
  const shakeControls = useAnimation()

  function reactToInput(newValue, prevValue, text) {
    if (newValue.length <= prevValue.length) return
    const i = newValue.length - 1
    if (i < text.length && newValue[i] !== text[i]) {
      playError()
      shakeControls.start({ x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.2 } })
    } else {
      playClick()
    }
  }

  return { shakeControls, reactToInput }
}
