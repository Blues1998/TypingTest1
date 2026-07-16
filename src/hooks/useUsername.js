import { useState } from 'react'
import { safeGet, safeSet } from '../utils/safeStorage.js'

export function useUsername() {
  const [username, setUsernameState] = useState(
    () => safeGet('typingtest_username')
  )

  function setUsername(name) {
    safeSet('typingtest_username', name)
    setUsernameState(name)
  }

  return { username, setUsername, hasUsername: !!username }
}
