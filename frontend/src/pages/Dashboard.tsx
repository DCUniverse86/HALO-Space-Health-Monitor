
import { useEffect, useState } from 'react'
import { haloApi } from '../api/client'
import type {
    AstronautStatus,
    BodySystem,
    TrendsResponse,
} from '../types/api'
import StatusTile from '../components/StatusTile'
import DashboardHeader from '../components/DashboardHeader'
import TrendsChart from '../components/TrendsChart'

// Allows the Home screen to open the Daily Check-In page.
interface DashboardProps {
    onStartCheckIn: () => void
    astronautId: string
    selectedDay: number
    onSelectDay: (day: number) => void
}

// HALO's five monitored health systems.
const bodySystems: BodySystem[] = [
    'cardiovascular',
    'immune',
    'musculoskeletal',
    'behavioral',
    'environment',
]

// Displays the astronaut's backend-calculated health status.
function Dashboard({
    onStartCheckIn,
    astronautId,
    selectedDay,
    onSelectDay,
}: DashboardProps) {


    // Wait briefly before requesting another mission day.
    const [requestDay, setRequestDay] = useState(selectedDay)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setRequestDay(selectedDay)
        }, 250)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [selectedDay])


    // Store Roman's health assessment for the selected day.
    const [healthStatus, setHealthStatus] =
        useState<AstronautStatus | null>(null)

    // Store heart-rate trends returned by Roman's backend.
    const [heartRateTrends, setHeartRateTrends] =
        useState<TrendsResponse | null>(null)

    const [trendsLoading, setTrendsLoading] = useState(true)
    const [trendsError, setTrendsError] =
        useState<string | null>(null)

    // Track actual API loading and error states.
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Retrieve the selected astronaut's heart-rate history.
    useEffect(() => {
        let active = true

        setTrendsLoading(true)
        setTrendsError(null)
        setHeartRateTrends(null)

        haloApi.trends(astronautId, 'rest_hr', 0, requestDay)
            .then((data) => {
                if (!active) {
                    return
                }

                setHeartRateTrends(data)
                setTrendsError(null)
            })
            .catch((err: unknown) => {
                if (!active) {
                    return
                }

                setHeartRateTrends(null)
                setTrendsError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load heart-rate trends.'
                )
            })
            .finally(() => {
                if (active) {
                    setTrendsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [astronautId, selectedDay])

    // Retrieve the selected astronaut's health assessment.
    useEffect(() => {
        let active = true

        setIsLoading(true)
        setError(null)
        setHealthStatus(null)

        haloApi.status(astronautId, requestDay)
            .then((data) => {
                if (!active) {
                    return
                }

                setHealthStatus(data)
                setError(null)
            })
            .catch((err: unknown) => {
                if (!active) {
                    return
                }

                setHealthStatus(null)
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load astronaut health data.'
                )
            })
            .finally(() => {
                if (active) {
                    setIsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [astronautId, requestDay])

    return (
        <main className="w-full">
            {/* HALO robot and overall health assessment. */}
            <DashboardHeader
                astronautName={
                    healthStatus?.astronaut_name ??
                    astronautId.charAt(0).toUpperCase() +
                        astronautId.slice(1)
                }
                missionDay={selectedDay}
                overallSeverity={
                    healthStatus?.day === selectedDay &&
                    healthStatus?.astronaut_id === astronautId
                        ? healthStatus.overall_severity
                        : null
                }
                isDemo={true}
            />

            {/* Shared mission-day replay below the health assessment. */}
            <section className="mt-6 mb-6 rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-4">
                    <label
                        htmlFor="mission-day-slider"
                        className="text-lg font-semibold"
                    >
                        Mission-Day Replay
                    </label>

                    <span className="font-bold text-[#F0B429]">
                        Day {selectedDay}
                    </span>
                </div>

                <input
                    id="mission-day-slider"
                    type="range"
                    min={0}
                    max={179}
                    step={1}
                    value={selectedDay}
                    onChange={(event) =>
                        onSelectDay(Number(event.target.value))
                    }
                    className="mt-5 w-full cursor-pointer accent-[#F0B429]"
                />

                <div className="mt-2 flex justify-between text-xs text-[#A8BDD6]">
                    <span>Day 0</span>
                    <span>Day 179</span>
                </div>

                <p className="mt-3 text-xs italic text-[#A8BDD6]">
                    Explore simulated astronaut health changes
                    throughout the 180-day mission.
                </p>
            </section>

            {isLoading ? (
                <p className="mt-6 text-[#A8BDD6]">
                    Updating mission health assessment...
                </p>
            ) : error ? (
                <p
                    role="alert"
                    className="mt-6 text-[#F03333]"
                >
                    {error}
                </p>
            ) : healthStatus &&
              healthStatus.astronaut_id === astronautId &&
              healthStatus.day === selectedDay ? (
                <>
                    {/* Display Roman's five health-system results. */}
                    <div className="mt-6 grid grid-cols-1 gap-4">
                        {bodySystems.map((system) => (
                            <StatusTile
                                key={system}
                                system={system}
                                severity={
                                    healthStatus.systems[system].severity
                                }
                                message={
                                    healthStatus.systems[system].message
                                }
                            />
                        ))}
                    </div>

                    {/* Display heart-rate trends from Roman's backend. */}
                    <div className="mt-6 w-full">
                        {trendsLoading ? (
                            <p className="text-[#A8BDD6]">
                                Loading heart-rate trends...
                            </p>
                        ) : trendsError ? (
                            <p
                                role="alert"
                                className="text-[#F03333]"
                            >
                                {trendsError}
                            </p>
                        ) : (
                            <TrendsChart
                                data={
                                    heartRateTrends?.astronaut_id ===
                                        astronautId &&
                                    heartRateTrends.points.at(-1)?.day ===
                                        selectedDay
                                        ? heartRateTrends
                                        : null
                                }
                            />
                        )}

                        <p className="mt-2 text-center text-xs text-[#A8BDD6]">
                            Simulated astronaut measurements —
                            calculated by HALO's backend detection engine.
                        </p>
                    </div>

                    {/* Start the astronaut's daily check-in. */}
                    <button
                        type="button"
                        onClick={onStartCheckIn}
                        className="mt-6 w-full rounded-xl bg-[#F0B429] px-6 py-4 font-bold text-[#102B4C] transition-colors hover:bg-[#FFD166]"
                    >
                        Start Daily Check-In
                    </button>

                    {/* HALO's medical safety disclaimer. */}
                    <p className="mt-6 px-3 text-center text-sm leading-relaxed text-[#A8BDD6]">
                        HALO is a decision-support research prototype,
                        not a certified medical device. Its simulated
                        data, health alerts, and AI-generated information
                        do not replace medical professionals, emergency
                        procedures, or established mission medical
                        protocols.
                    </p>
                </>
            ) : (
                <p className="mt-6 text-[#A8BDD6]">
                    No health data is available for this mission day.
                </p>
            )}
        </main>
    )
}

export default Dashboard
