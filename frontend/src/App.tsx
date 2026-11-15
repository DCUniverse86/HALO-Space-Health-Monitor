import { useEffect, useState } from 'react'
import { haloApi } from './api/client'
import Dashboard from './pages/Dashboard'
import BottomNav from './components/BottomNav'
import type { NavPage } from './components/BottomNav'
import DailyCheckIn from './pages/DailyCheckIn'
import Trends from './pages/Trends'
import Profile from './pages/Profile'
import Vitals from './pages/Vitals'
import AIStatusIndicator from './components/AIStatusIndicator'
import Escalation from './pages/Escalation'
import Chat from './pages/Chat'
import type { ChatMessage } from './pages/Chat'
import PlanetBackground from './components/PlanetBackground'
import BackendStatusIndicator from './components/BackendStatusIndicator'

// Main HALO application component.
function App() {
    // Track which HALO page is currently selected.
    const [activePage, setActivePage] = useState<NavPage>('home')

    // Preserve demo chat messages while navigating HALO.
    const [chatMessages, setChatMessages] =
        useState<ChatMessage[]>([
            {
                id: 1,
                sender: 'halo',
                text: 'Hello, Commander Alex. How can I assist you today?',
            },
        ])

    // Add an astronaut message to the current conversation.
    const handleSendMessage = (text: string) => {
        setChatMessages((previous) => [
            ...previous,
            {
                id: Date.now(),
                sender: 'astronaut',
                text,
            },
        ])
    }

    // Store the current FastAPI connection status.
    const [backendStatus, setBackendStatus] = 
        useState<'checking' | 'connected' | 'disconnected'>('checking')

    // Check backend availability when the application loads.
    useEffect(() => {
        let active = true

        haloApi.health()
            .then((data) => {
                if (!active) return

                setBackendStatus(
                    data.status === 'ok'
                        ? 'connected'
                        : 'disconnected'
                )
            })
            .catch(() => {
                if (active) {
                    setBackendStatus('disconnected')
                }
            })
        return () => {
            active = false
        }
    }, [])

    // Display HALO's selected page and bottom navigation.
    return (
        <main
            className="relative isolate flex min-h-screen flex-col items-center overflow-hidden
        bg-[url('/sky_stars_dark_phone.png')] bg-cover bg-center bg-fixed bg-no-repeat px-6 pt-6 pb-32 
        text-white md:bg-[url('/sky_stars_dark_wide.png')]"
        >
            <PlanetBackground layoutKey={activePage} />
            <div className="relative z-10 w-full max-w-6xl">
                {/* Display AI availability on every HALO page. */}
                <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
                    <BackendStatusIndicator status={backendStatus}/>
                    <AIStatusIndicator status="unknown" />
                </div>
                
                    {activePage === 'home' ? (
                    <Dashboard
                        onStartCheckIn={() => setActivePage('checkin')}
                />

                ) : activePage === 'vitals' ? (
                    <Vitals />
                ) : activePage === 'checkin' ? (
                    <DailyCheckIn />
                ) : activePage === 'trends' ? (
                    <Trends />
                ) : activePage === 'chat' ? (
                    <Chat
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        onContactMedicalOfficer={() =>
                            setActivePage('escalation')
                        }
                    />
                ) : activePage === 'profile' ? (
                    <Profile />
                ) : activePage === 'escalation' ? (
                    <Escalation onBack={() => setActivePage('chat')}/>
                ) : null}
            </div>

            <BottomNav
                activePage={activePage}
                onNavigate={setActivePage}
            />
        </main>
    )
}

export default App
