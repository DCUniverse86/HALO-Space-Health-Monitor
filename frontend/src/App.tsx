import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import BottomNav from './components/BottomNav'
import type { NavPage } from './components/BottomNav'
import DailyCheckIn from './pages/DailyCheckIn'

// Main HALO application component.
function App() {
  // Track which HALO page is currently selected
  const [activePage, setActivePage] = useState<NavPage>('home')
  // Display the selected HALO page, and bottom navigation.
  return (
    <main className="flex min-h-screen flex-col items-center bg-[url('/sky_stars_dark_phone.png')] 
    bg-cover bg-center bg-fixed bg-no-repeat px-6 pt-6 pb-32 text-white md:bg-[url('/sky_stars_dark_wide.png')]">

      <div className="mt-8 w-full max-w-6xl">
        {activePage === 'home' ? (
          <Dashboard onStartCheckIn={() => setActivePage('checkin')}/>
        ) : activePage === 'checkin' ? (
          <DailyCheckIn />
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
