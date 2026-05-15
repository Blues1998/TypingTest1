import { useState } from 'react'

export function useUsername() {
  const [username, setUsernameState] = useState(
    () => localStorage.getItem('typingtest_username') || null
  )

  function setUsername(name) {
    localStorage.setItem('typingtest_username', name)
    setUsernameState(name)
  }

  return { username, setUsername, hasUsername: !!username }
}
