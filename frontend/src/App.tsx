import { useEffect, useState } from 'react'
import { haloApi } from './api/client'
import Dashboard from './pages/Dashboard'
import BottomNav from './components/BottomNav'
import type { NavPage } from './components/BottomNav'

// Main HALO application component.
function App() {
  // Store the current FastAPI connection status.
  const [status, setStatus] = useState('Checking connection...')
  // Track which HALO page is currently selected
  const [activePage, setActivePage] = useState<NavPage>('home')

  // Check backend availability when the application loads.
  useEffect(() => {
    // Verify communication with the FastAPI backend.
    haloApi.health()
      .then((data) => {
        setStatus(
          data.status === 'ok'
            ? 'Connected to HALO backend'
            : 'Unexpected backend response',
        )
      })
      .catch(() => {
        setStatus('Unable to connect to HALO backend')
      })
  }, [])

  // Display the HALO heading, connection status, selected page, and navigation.
  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 px-6 pb-32 text-white">
      <h1 className="text-5xl font-bold text-yellow-400">
        HALO
      </h1>

      <p className="mt-4 text-center">
        Health Assessment & Longitudinal Observer
      </p>

      <div className="mt-8 rounded-xl bg-blue-800 px-8 py-4">
        {status}
      </div>
      <div className="mt-8 w-full max-w-6xl">
        {activePage === 'home' ? (
          <Dashboard />
        ) : (
          <p className="mt-6 text-center">
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)} page coming soon.
          </p>
        )}
      </div>
      <BottomNav
        activePage={activePage}
        onNavigate={setActivePage}
      />
    </main>
  )
}

export default App 
