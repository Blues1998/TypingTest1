import { useState } from 'react'
import { submitScore, getMyRank } from '../services/scoreService.js'
import { useUsername } from './useUsername.js'
import { supabase } from '../services/supabase.js'

export function useLeaderboardSubmit({ mode, wpm, accuracy, timeTaken, difficulty = null }) {
  const { username, setUsername, hasUsername } = useUsername()
  const [showModal, setShowModal]     = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [myRank, setMyRank]           = useState(null)

  async function doSubmit(name) {
    if (!supabase || submitting || submitted) return
    setSubmitting(true)
    try {
      await submitScore({ username: name, mode, wpm, accuracy, timeTaken, difficulty })
      setSubmitted(true)
      const rank = await getMyRank(mode, wpm)
      if (rank !== null) setMyRank(rank)
    } catch {
      setSubmitError('Submit failed. Try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmitClick() {
    if (!hasUsername) setShowModal(true)
    else doSubmit(username)
  }

  function handleModalConfirm(name) {
    setUsername(name)
    setShowModal(false)
    doSubmit(name)
  }

  return {
    username,
    showModal, setShowModal,
    submitted, submitting, submitError, myRank,
    handleSubmitClick, handleModalConfirm,
  }
}
