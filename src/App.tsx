import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import { useChores, useWeeklyLogs } from './hooks/useChores'
import { supabase } from './lib/supabase'
import { isSunday, getWeekStart, formatDateKey } from './utils/dates'

import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomePage } from './pages/HomePage'
import { LogPage } from './pages/LogPage'
import { QRScanPage } from './pages/QRScanPage'
import { AIVisionPage } from './pages/AIVisionPage'
import { TrackingPage } from './pages/TrackingPage'
import { AdminPage } from './pages/AdminPage'
import { QRManagerPage } from './pages/QRManagerPage'
import { SettingsPage } from './pages/SettingsPage'
import { SundayWinnerPage } from './pages/SundayWinnerPage'
import { CalendarPage } from './pages/CalendarPage'
import { PhotosPage } from './pages/PhotosPage'
import { BottomNav } from './components/BottomNav'

import type { Prize } from './types'

function AppShell() {
  const { user, loading: authLoading } = useAuth()
  const { household, member, members, loading: hhLoading, refresh: refreshHousehold } = useHousehold(user?.id)
  const { chores, refresh: refreshChores } = useChores(household?.id)
  const { logs: weeklyLogs, refresh: refreshLogs } = useWeeklyLogs(household?.id)
  const [showWinner, setShowWinner] = useState(false)
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null)
  const [winnerDismissed, setWinnerDismissed] = useState(false)

  useEffect(() => {
    if (!household || winnerDismissed) return
    const dismissedKey = `winner_dismissed_${formatDateKey(getWeekStart())}`
    if (sessionStorage.getItem(dismissedKey)) return
    const now = new Date()
    if (isSunday(now) && now.getHours() >= 20) {
      setShowWinner(true)
    }
    const weekStartStr = formatDateKey(getWeekStart())
    supabase
      .from('prizes')
      .select('*')
      .eq('household_id', household.id)
      .eq('week_start', weekStartStr)
      .maybeSingle()
      .then(({ data }) => setCurrentPrize(data))
  }, [household, winnerDismissed])

  function handleLogged() { refreshLogs() }
  function handleRefresh() { refreshHousehold(); refreshChores() }

  if (authLoading || hhLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <span className="text-5xl">🏡</span>
          <p className="text-gray-400 mt-3 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />
  if (!member || !household) return <OnboardingPage user={user} onComplete={() => refreshHousehold()} />

  if (showWinner && !winnerDismissed) {
    return (
      <SundayWinnerPage
        household={household}
        member={member}
        members={members}
        chores={chores}
        weeklyLogs={weeklyLogs}
        currentPrize={currentPrize}
        onDismiss={() => {
          sessionStorage.setItem(`winner_dismissed_${formatDateKey(getWeekStart())}`, '1')
          setWinnerDismissed(true)
          setShowWinner(false)
        }}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col relative">
      <Routes>
        <Route path="/" element={
          <HomePage household={household} member={member} members={members} chores={chores} weeklyLogs={weeklyLogs} onLogged={handleLogged} />
        } />
        <Route path="/log" element={
          <LogPage household={household} member={member} chores={chores} onLogged={handleLogged} />
        } />
        <Route path="/log/qr" element={
          <QRScanPage household={household} member={member} chores={chores} onLogged={handleLogged} />
        } />
        <Route path="/log/ai" element={
          <AIVisionPage household={household} member={member} chores={chores} onLogged={handleLogged} />
        } />
        <Route path="/tracking" element={
          <TrackingPage household={household} member={member} members={members} chores={chores} />
        } />
        {member.role === 'admin' && (
          <>
            <Route path="/admin" element={
              <AdminPage household={household} member={member} members={members} chores={chores} onRefresh={handleRefresh} />
            } />
            <Route path="/admin/qr" element={<QRManagerPage chores={chores} />} />
          </>
        )}
        <Route path="/calendar" element={
          <CalendarPage household={household} member={member} members={members} />
        } />
        <Route path="/photos" element={
          <PhotosPage household={household} member={member} members={members} />
        } />
        <Route path="/settings" element={
          <SettingsPage household={household} member={member} onRefresh={handleRefresh} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav member={member} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
