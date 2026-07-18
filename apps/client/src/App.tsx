import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { type ReactNode, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { Toaster } from './components/ui/toast'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { JourneyPage } from './pages/JourneyPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShortlistedPage } from './pages/ShortlistedPage'
import { UniversitiesPage } from './pages/UniversitiesPage'
import { useAuthStore } from './store/authStore'
import { usePreferencesStore } from './store/preferencesStore'
import { useThemeStore } from './store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/welcome" replace />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const user = useAuthStore((s) => s.user)
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <DashboardPage />
}

function App() {
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion)
  const fetchGlobalTheme = useThemeStore((s) => s.fetchGlobalTheme)

  useEffect(() => {
    fetchGlobalTheme()
  }, [fetchGlobalTheme])
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <OnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/journey" element={<JourneyPage />} />
                <Route path="/shortlisted" element={<ShortlistedPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/universities" element={<UniversitiesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/:tab"
                  element={
                    <RequireAdmin>
                      <AdminPage />
                    </RequireAdmin>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </QueryClientProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}

export default App
