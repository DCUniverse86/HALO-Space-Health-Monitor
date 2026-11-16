
import { useEffect, useState } from 'react'
import { haloApi } from '../api/client'
import type {
    AstronautStatus,
    TrendsResponse,
} from '../types/api'
import { Activity, HeartPulse } from 'lucide-react'
import TrendsChart from '../components/TrendsChart'

// Identifies the astronaut selected on the Profile page.
interface VitalsProps {
    astronautId: string
    selectedDay: number
}

// Time ranges available for the Vitals graph.
const timeRanges = [
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
    { days: 90, label: '90 Days' },
] as const

// Displays HALO's dedicated astronaut Vitals dashboard.
function Vitals({
    astronautId,
    selectedDay,
}: VitalsProps) {

    // Store health measurements from Roman's detection engine.
    const [healthStatus, setHealthStatus] =
        useState<AstronautStatus | null>(null)

    const [healthLoading, setHealthLoading] = useState(true)
    const [healthError, setHealthError] =
        useState<string | null>(null)

    

    // Retrieve the selected astronaut's day-75 measurements.
    useEffect(() => {
        let active = true

        setHealthLoading(true)
        setHealthError(null)
        setHealthStatus(null)

        haloApi.status(astronautId, selectedDay)
            .then((data) => {
                if (!active) {
                    return
                }

                setHealthStatus(data)
            })
            .catch((error: unknown) => {
                if (!active) {
                    return
                }

                setHealthError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load astronaut vitals.'
                )
            })
            .finally(() => {
                if (active) {
                    setHealthLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [astronautId, selectedDay])

    
    // Store historical measurements from Roman's backend.
    const [trends, setTrends] =
        useState<TrendsResponse | null>(null)

    const [trendsLoading, setTrendsLoading] = useState(true)
    const [trendsError, setTrendsError] =
        useState<string | null>(null)


    // Track the selected graph time range.
    const [selectedRange, setSelectedRange] =
        useState<7 | 30 | 90>(7)

    // Track whether Vitals or History is selected.
    const [activeTab, setActiveTab] =
        useState<'vitals' | 'history'>('vitals')

    // Keep requested mission days within the valid 0-179 range.
    const startDay = Math.max(
        0,
        selectedDay - selectedRange + 1
    )

    // Retrieve the selected astronaut's historical heart-rate data.
    useEffect(() => {
        let active = true

        setTrends(null)
        setTrendsLoading(true)
        setTrendsError(null)

        haloApi.trends(
            astronautId,
            'rest_hr',
            startDay,
            selectedDay
        )
            .then((data) => {
                if (!active) {
                    return
                }

                setTrends(data)
            })
            .catch((error: unknown) => {
                if (!active) {
                    return
                }

                setTrendsError(
                    error instanceof Error
                        ? error.message
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
    }, [astronautId, startDay, selectedDay])


    return (
        <main className="mx-auto w-full max-w-6xl pb-24 text-white">
            {/* Vitals page header */}
            <header className="mb-6">
                <div className="flex items-center gap-3">
                    <HeartPulse
                        size={28}
                        className="text-[#F0B429]"
                        aria-hidden="true"
                    />

                    <h1 className="text-3xl font-bold">
                        Vitals
                    </h1>
                </div>

                <p className="mt-2 italic text-[#A8BDD6]">
                    {healthStatus?.astronaut_id === astronautId &&
                    healthStatus?.day === selectedDay
                        ? `${healthStatus.astronaut_name} · Mission Day ${selectedDay}`
                        : `Mission Day ${selectedDay} · Loading astronaut data`}        
                </p>

                <p className="mt-2 text-xs text-[#A8BDD6]">
                    DEMO DATA — Simulated measurements
                </p>
            </header>

            {healthError && (
                <p
                    role="alert"
                    className="mb-4 text-sm text-[#F03333]"
                >
                        {healthError}
                </p>
            )}
                
            {/* Vitals and History navigation */}
            <div className="mb-6 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setActiveTab('vitals')}
                    aria-pressed={activeTab === 'vitals'}
                    className={`rounded-full px-6 py-3 font-semibold ${
                        activeTab === 'vitals'
                            ? 'bg-[#F0B429] text-[#102B4C]'
                            : 'bg-[#1F4A85] text-white'
                    }`}
                >
                    Vitals
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    aria-pressed={activeTab === 'history'}
                    className={`rounded-full px-6 py-3 font-semibold ${
                        activeTab === 'history'
                            ? 'bg-[#F0B429] text-[#102B4C]'
                            : 'bg-[#1F4A85] text-white'
                    }`}
                >
                    History
                </button>
            </div>

            {activeTab === 'vitals' ? (
                <>
                    {/* Latest measurement cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg">
                            <div className="flex items-center gap-2">
                                <HeartPulse
                                    size={20}
                                    className="text-[#F0B429]"
                                    aria-hidden="true"
                                />
                                <h2 className="font-semibold">
                                    Resting Heart Rate
                                </h2>
                            </div>

                            <p className="mt-4 text-3xl font-bold">
                                {healthLoading
                                    ? 'Loading...'
                                    : healthStatus?.metrics.rest_hr?.value ?? '--'} bpm
                            </p>

                            <p className="mt-2 text-sm text-[#F0B429]">
                                {healthStatus?.metrics.rest_hr
                                    ? `${healthStatus.metrics.rest_hr.severity} · Backend assessment`
                                    : 'Assessment unavailable'}
                            </p>
                        </section>

                        <section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg">
                            <h2 className="font-semibold">
                                Blood Oxygen
                            </h2>

                            <p className="mt-4 text-3xl font-bold">
                                {healthLoading
                                    ? 'Loading...'
                                    : healthStatus?.metrics.spo2?.value ?? '--'}%
                            </p>

                            <p className="mt-2 text-sm text-[#A8BDD6]">
                                Simulated measurement
                            </p>
                        </section>

                        <section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg">
                            <h2 className="font-semibold">
                                Temperature
                            </h2>

                            <p className="mt-4 text-xl font-medium text-[#A8BDD6]">
                                {healthLoading
                                    ? 'Loading...'
                                    : healthStatus?.metrics.temp_c?.value != null
                                        ? `${healthStatus.metrics.temp_c.value} °C`
                                        : 'Not recorded'}
                            </p>
                        </section>

                        <section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg">
                            <h2 className="font-semibold">
                                Blood Pressure
                            </h2>

                            <p className="mt-4 text-xl font-medium text-[#A8BDD6]">
                                Not recorded
                            </p>
                        </section>
                    </div>

                    {/* Reuse the shared graph component. */}
                    
                    <div className="mt-6">
                        {trendsLoading ? (
                            <p
                                role="status"
                                className="text-[#A8BDD6]"
                            >
                                Loading heart-rate history...
                            </p>
                        ) : trendsError ? (
                            <p
                                role="alert"
                                className="text-[#F03333]"
                            >
                                {trendsError}
                            </p>
                        ) : (
                            <TrendsChart data={trends} />
                        )}

                        <p className="mt-2 text-center text-xs text-[#A8BDD6]">
                            Simulated astronaut measurements from
                            HALO's backend detection engine.
                        </p>
                    </div>


                    {/* Time-range selection */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {timeRanges.map((range) => (
                            <button
                                key={range.days}
                                type="button"
                                onClick={() =>
                                    setSelectedRange(range.days)
                                }
                                aria-pressed={
                                    selectedRange === range.days
                                }
                                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                                    selectedRange === range.days
                                        ? 'bg-[#F0B429] text-[#102B4C]'
                                        : 'bg-[#1F4A85] text-white'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                
<section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg">
    <div className="flex items-center gap-2">
        <Activity
            size={20}
            className="text-[#F0B429]"
            aria-hidden="true"
        />

        <h2 className="text-xl font-semibold">
            Measurement History
        </h2>
    </div>

    <p className="mt-2 text-sm text-[#A8BDD6]">
        Simulated resting heart-rate measurements through
        mission day {selectedDay}.
    </p>

    {trendsLoading ? (
        <p role="status" className="mt-4 text-[#A8BDD6]">
            Loading measurement history...
        </p>
    ) : trendsError ? (
        <p role="alert" className="mt-4 text-[#F03333]">
            {trendsError}
        </p>
    ) : !trends ||
      trends.astronaut_id !== astronautId ||
      trends.metric !== 'rest_hr' ||
      trends.points.some((point) => point.day > selectedDay) ? (
        <p className="mt-4 text-[#A8BDD6]">
            Measurement history is unavailable.
        </p>
    ) : trends.points.length === 0 ? (
        <p className="mt-4 text-[#A8BDD6]">
            No measurements recorded for this period.
        </p>
    ) : (
        <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                    <tr className="border-b border-[#7199C3] text-[#C4D4E6]">
                        <th scope="col" className="px-2 py-3">
                            Mission Day
                        </th>
                        <th scope="col" className="px-2 py-3">
                            Heart Rate
                        </th>
                        <th scope="col" className="px-2 py-3">
                            Severity
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {[...trends.points].reverse().map((point) => (
                        <tr
                            key={point.day}
                            className="border-b border-[#6282A6]/30"
                        >
                            <td className="px-2 py-3">
                                Day {point.day}
                            </td>

                            <td className="px-2 py-3">
                                {point.value !== null
                                    ? `${point.value} ${trends.unit}`
                                    : 'Not recorded'}
                            </td>

                            <td className="px-2 py-3">
                                <span
                                    className={`font-semibold ${
                                        point.severity === 'RED'
                                            ? 'text-[#FF6472]'
                                            : point.severity === 'YELLOW'
                                                ? 'text-[#F0B429]'
                                                : 'text-[#4CC38A]'
                                    }`}
                                >
                                    {point.value !== null
                                        ? point.severity
                                        : 'Unavailable'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )}

    <p className="mt-4 text-xs italic text-[#C4D4E6]">
        Severity classifications are supplied by HALO's
        backend detection engine.
    </p>
</section>

            )}

            <p className="mt-8 text-center text-xs italic text-[#A8BDD6]">
                Decision support prototype. Not a medical device.
            </p>
        </main>
    )
}

export default Vitals
