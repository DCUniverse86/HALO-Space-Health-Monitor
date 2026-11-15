import { useEffect, useState } from 'react'
import { haloApi } from './api/client'
import Dashboard from './pages/Dashboard'
import BottomNav from './components/BottomNav'
import type { NavPage } from './components/BottomNav'
import DailyCheckIn from './pages/DailyCheckIn'
import Trends from './pages/Trends'

// Main HALO application component.
function App() {
    // Track which HALO page is currently selected.
    const [activePage, setActivePage] = useState<NavPage>('home')

    // Store the current FastAPI connection status.
    const [status, setStatus] = useState('Checking connection...')

    // Check backend availability when the application loads.
    useEffect(() => {
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

    // Display HALO's selected page and bottom navigation.
    return (
        <main
            className="flex min-h-screen flex-col items-center bg-[url('/sky_stars_dark_phone.png')] bg-cover bg-center bg-fixed bg-no-repeat px-6 pt-6 pb-32 text-white md:bg-[url('/sky_stars_dark_wide.png')]"
        >
            <div className="w-full max-w-6xl">
                {activePage === 'home' ? (
                    <Dashboard
                        onStartCheckIn={() => setActivePage('checkin')}
                    />
                ) : activePage === 'checkin' ? (
                    <DailyCheckIn />
                ) : activePage === 'trends' ? (
                    <Trends />
                ) : (
                    <p className="mt-6 text-center">
                        {activePage.charAt(0).toUpperCase() + activePage.slice(1)} page coming soon.
                    </p>
                )}
            </div>

            {/* Preserve backend monitoring without changing the visible layout. */}
            <span className="sr-only" role="status">
                {status}
            </span>

            <BottomNav
                activePage={activePage}
                onNavigate={setActivePage}
            />
        </main>
    )
}

export default App
