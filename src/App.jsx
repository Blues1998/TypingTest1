import { useState, useEffect, createContext } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { loadData } from './utils/dataLoader.js'
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

export const DataContext = createContext(null)

// Apply font preference before first paint (synchronous, runs once at module load)
document.documentElement.setAttribute(
  'data-font',
  localStorage.getItem('typingtest_font') || 'jetbrains'
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
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  useTheme() // initialize data-theme attribute on <html> immediately
  const [data, setData] = useState(null)

  function fetchData() {
    loadData().then(setData).catch(() => {
      setData({
        words: [],
        sentences: { rookie: [], standard: [], advanced: [], elite: [] },
        longTexts:  { standard: [], advanced: [], elite: [] },
        codeSnippets: [],
        quotes: [],
      })
    })
  }

  useEffect(() => {
    fetchData()
    window.addEventListener('typingtest-lang-changed', fetchData)
    return () => window.removeEventListener('typingtest-lang-changed', fetchData)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sub text-sm">loading...</span>
      </div>
    )
  }

  return (
    <DataContext.Provider value={data}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
        </div>
      </BrowserRouter>
      {/* Rendered outside BrowserRouter so PageWrapper transforms never trap it */}
      <AchievementToast />
    </DataContext.Provider>
  )
}

export default App
