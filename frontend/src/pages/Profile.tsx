import { useEffect, useState } from 'react'
import { haloApi } from '../api/client'
import type { BaselineResponse } from '../types/api'
import {
    Bell,
    ChevronRight,
    Clock3,
    LockKeyhole,
} from 'lucide-react'
import type { Astronaut } from '../types/api'

type Setting = 'reminders' | 'units' | 'privacy'

interface ProfileProps {
    astronauts: Astronaut[]
    selectedAstronautId: string
    selectedDay: number
    onSelectAstronaut: (id: string) => void
    isLoading: boolean
    error: string | null
}

const cardClass =
    'rounded-[20px] bg-linear-to-br from-[#28598D] to-[#173A66] p-4 shadow-lg sm:p-5'

// Displays the selected astronaut's profile and settings.
function Profile({
    astronauts,
    selectedAstronautId,
    selectedDay,
    onSelectAstronaut,
    isLoading,
    error,
}: ProfileProps) {
    const [openSetting, setOpenSetting] =
        useState<Setting | null>(null)

    // Find the selected astronaut from the backend list.
    const selectedAstronaut = astronauts.find(
        (astronaut) => astronaut.id === selectedAstronautId
    )

    const toggleSetting = (setting: Setting) => {
        setOpenSetting(
            (current) => current === setting ? null : setting
        )
    }

    // Store the selected astronaut's personal baseline.
    const [baseline, setBaseline] =
        useState<BaselineResponse | null>(null)

    const [baselineLoading, setBaselineLoading] = useState(true)
    const [baselineError, setBaselineError] =
        useState<string | null>(null)

    // Retrieve baseline measurements from Roman's backend.
    useEffect(() => {
        let active = true

        setBaseline(null)
        setBaselineLoading(true)
        setBaselineError(null)

        haloApi.baseline(selectedAstronautId)
            .then((data) => {
                if (!active) {
                    return
                }

                setBaseline(data)
            })
            .catch((error: unknown) => {
                if (!active) {
                    return
                }

                setBaselineError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load personal baseline.'
                )
            })
            .finally(() => {
                if (active) {
                    setBaselineLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [selectedAstronautId])


    return (
        <main className="mx-auto w-full max-w-6xl px-2 pb-28 text-white sm:px-4 lg:px-6">
            <header className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">
                    Profile
                </h1>

                <span className="tracking-[0.28em] text-[#C1D2E7]">
                    HALO
                </span>
            </header>

            <div className="mt-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                {/* Preserve the existing HALO robot avatar. */}
                <div
                    aria-label="HALO robot avatar"
                    role="img"
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#7199C3] bg-[#E4EDF7] shadow-[0_0_0_3px_#102B4C] sm:h-28 sm:w-28"
                >
                    <div className="relative h-14 w-[74px] rounded-[28px] border-[5px] border-[#527CA7] bg-[#102B4C] sm:h-16 sm:w-[84px]">
                        <span className="absolute left-4 top-4 h-2 w-2 rounded-full bg-[#F0B429]" />
                        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#F0B429]" />
                        <span className="absolute bottom-3 left-1/2 h-3 w-6 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#F0B429]" />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs tracking-[0.18em] text-[#A8BDD6]">
                        SIMULATED ASTRONAUT PROFILE
                    </p>

                    <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {selectedAstronaut?.name ?? 'Astronaut unavailable'}
                    </h2>

                    <p className="mt-1 text-sm italic text-[#B9C9DD] sm:text-base">
                        Crew member · Mission day {selectedDay}
                    </p>

                    {/* Select an astronaut from the backend. */}
                    <div className="mt-4">
                        <label
                            htmlFor="astronaut-select"
                            className="mb-2 block text-sm font-semibold text-[#C4D4E6]"
                        >
                            Select Astronaut
                        </label>

                        <select
                            id="astronaut-select"
                            value={selectedAstronautId}
                            onChange={(event) =>
                                onSelectAstronaut(event.target.value)
                            }
                            disabled={isLoading || astronauts.length === 0}
                            className="w-full max-w-sm rounded-xl border border-[#7199C3] bg-[#173A66] px-4 py-3 text-white outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/40 disabled:opacity-50"
                        >
                            {astronauts.length === 0 && (
                                <option value={selectedAstronautId}>
                                    No astronauts available
                                </option>
                            )}

                            {astronauts.map((astronaut) => (
                                <option
                                    key={astronaut.id}
                                    value={astronaut.id}
                                >
                                    {astronaut.name}
                                </option>
                            ))}
                        </select>

                        {isLoading && (
                            <p
                                role="status"
                                className="mt-2 text-sm text-[#A8BDD6]"
                            >
                                Loading astronaut profiles...
                            </p>
                        )}

                        {error && (
                            <p
                                role="alert"
                                className="mt-2 text-sm text-[#F03333]"
                            >
                                {error}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                {/* Mission information from the backend. */}
                <section
                    className={cardClass}
                    aria-labelledby="mission-details-title"
                >
                    <h2
                        id="mission-details-title"
                        className="border-b border-[#6282A6]/40 pb-2 text-xl font-bold"
                    >
                        Mission details
                    </h2>

                    <dl className="mt-3 space-y-2 text-sm sm:text-base">
                        <div className="flex justify-between gap-4">
                            <dt className="text-[#C4D4E6]">
                                Mission:
                            </dt>
                            <dd className="text-right">
                                {selectedAstronaut?.mission ?? 'Unavailable'}
                            </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                            <dt className="text-[#C4D4E6]">
                                Crew ID:
                            </dt>
                            <dd>
                                {selectedAstronaut?.id ?? 'Unavailable'}
                            </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                            <dt className="text-[#C4D4E6]">
                                Role:
                            </dt>
                            <dd>
                                Not specified
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Baseline values remain demo data until connected. */}
                
                {/* Personal baseline from Roman's detection engine. */}
                <section
                    className={cardClass}
                    aria-labelledby="baseline-title"
                >
                    <h2
                        id="baseline-title"
                        className="text-xl font-bold"
                    >
                        Personal baseline
                    </h2>

                    {baselineLoading ? (
                        <p
                            role="status"
                            className="mt-3 text-sm text-[#C4D4E6]"
                        >
                            Loading personal baseline...
                        </p>
                    ) : baselineError ? (
                        <p
                            role="alert"
                            className="mt-3 text-sm text-[#F03333]"
                        >
                            {baselineError}
                        </p>
                    ) : baseline ? (
                        <>
                            <p className="mt-3 text-sm sm:text-base">
                                Resting heart rate:{' '}
                                {baseline.metrics.rest_hr?.median ?? '--'} bpm
                            </p>

                            <p className="mt-1 text-sm sm:text-base">
                                Usual sleep:{' '}
                                {baseline.metrics.sleep_h?.median ?? '--'} hours
                            </p>

                            <p className="mt-1 text-xs italic text-[#C4D4E6]">
                                Simulated astronaut baseline calculated
                                by HALO's detection engine.
                            </p>
                        </>
                    ) : (
                        <p className="mt-3 text-sm text-[#C4D4E6]">
                            No baseline measurements available.
                        </p>
                    )}
                </section>


                {/* Preserve the existing Profile settings. */}
                <section
                    className={`${cardClass} md:col-span-2`}
                    aria-labelledby="settings-title"
                >
                    <h2
                        id="settings-title"
                        className="mb-2 text-xl font-bold"
                    >
                        Settings
                    </h2>

                    {([
                        {
                            id: 'reminders' as const,
                            label: 'Reminders',
                            icon: Bell,
                            detail: 'Reminder preferences will be available when profile settings are connected.',
                        },
                        {
                            id: 'units' as const,
                            label: 'Units and time',
                            icon: Clock3,
                            detail: 'Measurement units and time preferences are not configurable in this demo.',
                        },
                        {
                            id: 'privacy' as const,
                            label: 'Privacy and sharing',
                            icon: LockKeyhole,
                            detail: 'Privacy and sharing controls will be available after backend integration.',
                        },
                    ]).map((item) => {
                        const Icon = item.icon

                        return (
                            <div
                                key={item.id}
                                className="border-b border-[#6282A6]/40 last:border-b-0"
                            >
                                <button
                                    type="button"
                                    aria-expanded={openSetting === item.id}
                                    onClick={() =>
                                        toggleSetting(item.id)
                                    }
                                    className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm sm:text-base"
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon
                                            size={17}
                                            className="text-[#C4D4E6]"
                                            aria-hidden="true"
                                        />
                                        {item.label}
                                    </span>

                                    <ChevronRight
                                        size={18}
                                        className={`text-[#C4D4E6] transition-transform ${
                                            openSetting === item.id
                                                ? 'rotate-90'
                                                : ''
                                        }`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {openSetting === item.id && (
                                    <p className="pb-3 text-sm text-[#C4D4E6]">
                                        {item.detail}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </section>
            </div>

            <p className="mt-8 text-center text-xs italic text-[#B9C9DD]">
                Decision support prototype. Not a medical device.
            </p>
        </main>
    )
}

export default Profile
