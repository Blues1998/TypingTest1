import { useState, useEffect, useCallback, createContext } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { loadData } from './utils/dataLoader.js'
import { safeGet } from './utils/safeStorage.js'
import { useTheme } from './hooks/useTheme.js'
import { NavBar } from './components/layout/NavBar.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { TypingPage } from './pages/TypingPage.jsx'
import { BubblePage } from './pages/BubblePage.jsx'
import { SurvivalPage } from './pages/SurvivalPage.jsx'
import { CodePage } from './pages/CodePage.jsx'
import { LeaderboardPage } from './pages/LeaderboardPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { AchievementsPage } from './pages/AchievementsPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { AchievementToast } from './components/AchievementToast.jsx'
import { GhostLobbyPage } from './pages/GhostLobbyPage.jsx'

export const DataContext = createContext(null)

// Apply font preference before first paint (synchronous, runs once at module load)
document.documentElement.setAttribute(
  'data-font',
  safeGet('typingtest_font') || 'jetbrains'
)

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"            element={<HomePage />} />
        <Route path="/type/:mode"  element={<TypingPage />} />
        <Route path="/bubble"      element={<BubblePage />} />
        <Route path="/survival"    element={<SurvivalPage />} />
        <Route path="/type/code"   element={<CodePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/history"       element={<HistoryPage />} />
        <Route path="/achievements"  element={<AchievementsPage />} />
        <Route path="/settings"      element={<SettingsPage />} />
        <Route path="/ghost"         element={<GhostLobbyPage />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  useTheme() // initialize data-theme attribute on <html> immediately
  const [data, setData] = useState(null)

  const fetchData = useCallback(() => {
    loadData().then(setData).catch(err => {
      console.error('Failed to load typing data; falling back to empty dataset.', err)
      setData({
        words: [],
        sentences: { rookie: [], standard: [], advanced: [], elite: [] },
        longTexts:  { standard: [], advanced: [], elite: [] },
        codeSnippets: [],
        quotes: [],
      })
    })
  }, [])

  useEffect(() => {
    fetchData()
    window.addEventListener('typingtest-lang-changed', fetchData)
    return () => window.removeEventListener('typingtest-lang-changed', fetchData)
  }, [fetchData])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sub text-sm">loading...</span>
      </div>
    )
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DataContext.Provider value={data}>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
        </div>
        {/* Rendered outside AnimatedRoutes so PageWrapper transforms never trap it */}
        <AchievementToast />
      </DataContext.Provider>
    </BrowserRouter>
  )
}

export default App
