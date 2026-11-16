
import { useEffect, useState } from 'react'
import { haloApi } from './api/client'
import type { Astronaut } from './types/api'
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
    const [activePage, setActivePage] =
        useState<NavPage>('home')

    // Share the selected mission day across HALO pages.
    const [selectedDay, setSelectedDay] =
        useState<number>(75)

    // Store astronauts available from FastAPI.
    const [astronauts, setAstronauts] =
        useState<Astronaut[]>([])

    // Share the selected astronaut across HALO pages.
    const [selectedAstronautId, setSelectedAstronautId] =
        useState<string>('alex')

    const [astronautsLoading, setAstronautsLoading] =
        useState(true)

    const [astronautsError, setAstronautsError] =
        useState<string | null>(null)

    // Track FastAPI availability.
    const [backendStatus, setBackendStatus] =
        useState<'checking' | 'connected' | 'disconnected'>(
            'checking'
        )

    // Track the last successfully verified assistant mode.
        const [aiStatus, setAiStatus] =
            useState<'online' | 'offline' | 'unknown'>('unknown')
    
        // Track AI assistant requests.
    const [assistantLoading, setAssistantLoading] =
        useState(false)

    const [assistantError, setAssistantError] =
        useState<string | null>(null)

    // Preserve chat messages while navigating.
    const [chatMessages, setChatMessages] =
        useState<ChatMessage[]>([
            {
                id: 1,
                sender: 'halo',
                text: 'Hello! I am HALO. How can I assist you today?',
            },
        ])

    // Retrieve available astronauts.
    useEffect(() => {
        let active = true

        haloApi.astronauts()
            .then((data) => {
                if (!active) return

                setAstronauts(data.astronauts)
                setAstronautsError(null)
            })
            .catch((error: unknown) => {
                if (!active) return

                setAstronautsError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load astronaut profiles.'
                )
            })
            .finally(() => {
                if (active) {
                    setAstronautsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [])


    // Check Gemini availability when HALO starts.
    useEffect(() => {
        let active = true

        haloApi.aiStatus()
            .then((response) => {
                if (!active) return

                setAiStatus(
                    response.status === 'online'
                        ? 'online'
                        : 'offline'
                )
            })
            .catch(() => {
                if (active) {
                    setAiStatus('unknown')
                }
            })

        return () => {
            active = false
        }
    }, [])


    // Check backend availability.
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

    // Send astronaut messages to Donte's assistant.
    const handleSendMessage = async (message: string) => {
        if (!message.trim() || assistantLoading) {
            return
        }

        setChatMessages((previous) => [
            ...previous,
            {
                id: Date.now(),
                sender: 'astronaut',
                text: message,
            },
        ])

        setAssistantLoading(true)
        setAssistantError(null)

        try {
            const response = await haloApi.assistant(
                selectedAstronautId,
                {
                    day: selectedDay,
                    flag_id: null,
                    message,
                }
            )

            setAiStatus(
                response.mode === 'ai'
                    ? 'online'
                    : 'offline'
)

            const responseText = [
                response.summary,
                response.likely_causes.length > 0
                    ? `Possible causes:\n${response.likely_causes.join('\n')}`
                    : '',
                response.questions.length > 0
                    ? `Follow-up questions:\n${response.questions.join('\n')}`
                    : '',
                response.actions.length > 0
                    ? `Recommended actions:\n${response.actions.join('\n')}`
                    : '',
                response.mode === 'offline_rules'
                    ? 'Offline rules response.'
                    : '',
                response.disclaimer,
            ]
                .filter(Boolean)
                .join('\n\n')

            setChatMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    sender: 'halo',
                    text: responseText,
                },
            ])
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unable to retrieve HALO guidance.'

            setAssistantError(errorMessage)

            setAiStatus('unknown')

            setChatMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    sender: 'halo',
                    text: `Unable to retrieve guidance: ${errorMessage}`,
                },
            ])
        } finally {
            setAssistantLoading(false)
        }
    }

    // Display HALO's selected page.
    return (
        <main
            className="relative isolate flex min-h-screen flex-col items-center overflow-hidden
            bg-[url('/sky_stars_dark_phone.png')] bg-cover bg-center bg-fixed bg-no-repeat
            px-6 pt-6 pb-32 text-white
            md:bg-[url('/sky_stars_dark_wide.png')]"
        >
            <PlanetBackground layoutKey={activePage} />

            <div className="relative z-10 w-full max-w-6xl">
                {/* Backend and AI availability indicators. */}
                <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
                    <BackendStatusIndicator status={backendStatus} />
                    <AIStatusIndicator status={aiStatus} />
                </div>

                {activePage === 'home' ? (
                    <Dashboard
                        onStartCheckIn={() =>
                            setActivePage('checkin')
                        }
                        astronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                    />
                ) : activePage === 'vitals' ? (
                    <Vitals
                        astronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                    />
                ) : activePage === 'checkin' ? (
                    <DailyCheckIn
                        astronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                    />
                ) : activePage === 'trends' ? (
                    <Trends
                        astronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                    />
                ) : activePage === 'chat' ? (
                    <>
                        
                    <Chat
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        onContactMedicalOfficer={() =>
                            setActivePage('escalation')
                        }
                        astronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                        assistantLoading={assistantLoading}
                        aiStatus={aiStatus}
                        />


                        {assistantLoading && (
                            <p
                                role="status"
                                className="mt-3 text-center text-sm text-[#A8BDD6]"
                            >
                                HALO is preparing a response...
                            </p>
                        )}

                        {assistantError && (
                            <p
                                role="alert"
                                className="mt-3 text-center text-sm text-[#FF6472]"
                            >
                                {assistantError}
                            </p>
                        )}
                    </>
                ) : activePage === 'profile' ? (
                    <Profile
                        astronauts={astronauts}
                        selectedAstronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                        onSelectAstronaut={setSelectedAstronautId}
                        isLoading={astronautsLoading}
                        error={astronautsError}
                    />
                ) : activePage === 'escalation' ? (
                    <Escalation
                        astronautId={selectedAstronautId}
                        selectedDay={selectedDay}
                        onBack={() => setActivePage('chat')}
                    />
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
