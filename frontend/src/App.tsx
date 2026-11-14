import { useEffect, useState } from 'react'
import { haloApi } from './api/client'
import Dashboard from './pages/Dashboard'

// Main HALO application component.
function App() {
  // Store the current FastAPI connection status.
  const [status, setStatus] = useState('Checking connection...')

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

  // Display the HALO heading, backend connection status, and Dashboard.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white">
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
        <Dashboard />
      </div>
    </main>
  )
}

export default App 
