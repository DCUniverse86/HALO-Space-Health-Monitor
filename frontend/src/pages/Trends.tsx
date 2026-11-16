
import { useEffect, useState } from 'react'
import { haloApi } from '../api/client'
import TrendsChart from '../components/TrendsChart'
import type {
    BodySystem,
    TrendsResponse,
} from '../types/api'

// Identifies the astronaut selected on the Profile page.
interface TrendsProps {
    astronautId: string
    selectedDay: number
}

// HALO's five monitored health systems.
const healthSystems: { id: BodySystem; label: string }[] = [
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'immune', label: 'Immune' },
    { id: 'musculoskeletal', label: 'Musculoskeletal' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'environment', label: 'Environment' },
]

// Map health systems to Roman's supported backend metrics.
const healthMetrics: Record<
    BodySystem,
    { id: string; label: string }[]
> = {
    cardiovascular: [
        { id: 'rest_hr', label: 'Resting Heart Rate' },
        { id: 'hrv', label: 'Heart Rate Variability' },
    ],
    immune: [
        { id: 'temp_c', label: 'Body Temperature' },
        { id: 'spo2', label: 'Blood Oxygen' },
        { id: 'fatigue', label: 'Fatigue' },
    ],
    musculoskeletal: [
        { id: 'exercise_min', label: 'Exercise Minutes' },
        { id: 'back_pain', label: 'Back Pain' },
    ],
    behavioral: [
        { id: 'mood', label: 'Mood' },
        { id: 'sleep_h', label: 'Sleep Duration' },
        { id: 'social_h', label: 'Social Interaction' },
    ],
    environment: [
        { id: 'co2_ppm', label: 'Cabin CO2' },
    ],
}

// Available historical time ranges.
const timeRanges = [
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
    { days: 90, label: '90 Days' },
] as const

// Displays backend-provided health trends.
function Trends({
    astronautId,
    selectedDay,
}: TrendsProps) {
    const [selectedSystem, setSelectedSystem] =
        useState<BodySystem>('cardiovascular')

    const [selectedMetric, setSelectedMetric] =
        useState('rest_hr')

    const [selectedRange, setSelectedRange] =
        useState<7 | 30 | 90>(30)

    // Store historical measurements from Roman's backend.
    const [trends, setTrends] =
        useState<TrendsResponse | null>(null)

    const [trendsLoading, setTrendsLoading] =
        useState(true)

    const [trendsError, setTrendsError] =
        useState<string | null>(null)

    const startDay = Math.max(
        0,
        selectedDay - selectedRange + 1
    )

    // Retrieve trends for the selected astronaut and metric.
    useEffect(() => {
        let active = true

        setTrends(null)
        setTrendsLoading(true)
        setTrendsError(null)

        haloApi.trends(
            astronautId,
            selectedMetric,
            startDay,
            selectedDay
        )
            .then((data) => {
                if (!active) {
                    return
                }

                setTrends(data)
                setTrendsError(null)
            })
            .catch((error: unknown) => {
                if (!active) {
                    return
                }

                setTrends(null)
                setTrendsError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load health trends.'
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
    }, [astronautId, selectedMetric, startDay, selectedDay])

    // Find metrics belonging to the selected health system.
    const availableMetrics = healthMetrics[selectedSystem]

    const activeMetric = availableMetrics.find(
        (metric) => metric.id === selectedMetric
    )

    // Reset the selected metric when changing health systems.
    const changeSystem = (system: BodySystem) => {
        setSelectedSystem(system)
        setSelectedMetric(healthMetrics[system][0].id)
    }

    // Roman's backend already filters the requested day range.
    // Never display a previous request's data as current.
    const selectedTrendData =
        trends?.astronaut_id === astronautId &&
        trends?.metric === selectedMetric &&
        trends.points.every(
            (point) =>
                point.day >= startDay &&
                point.day <= selectedDay
        )
            ? trends
            : null

    // Identify non-GREEN measurements using backend severity.
    const flaggedPoints = selectedTrendData?.points.filter(
        (point) =>
            point.severity !== 'GREEN' &&
            point.value !== null
    ) ?? []

    const latestFlag = flaggedPoints.length > 0
        ? flaggedPoints[flaggedPoints.length - 1]
        : null

    const firstDay = selectedTrendData?.points[0]?.day

    const lastDay = selectedTrendData?.points[
        selectedTrendData.points.length - 1
    ]?.day

    const daysAvailable =
        selectedTrendData?.points.length ?? 0

    return (
        <main className="mx-auto w-full max-w-6xl pb-20 text-white">
            <header className="mb-5">
                <h1 className="text-3xl font-bold">
                    Trends
                </h1>

                <p className="mt-2 text-sm italic text-[#C1D2E7]">
                    Monitor changes across HALO's five health systems.
                </p>
            </header>

            {/* Health system and metric selectors. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="healthSystem"
                        className="mb-2 block text-sm font-medium"
                    >
                        Health System
                    </label>

                    <select
                        id="healthSystem"
                        value={selectedSystem}
                        onChange={(event) =>
                            changeSystem(
                                event.target.value as BodySystem
                            )
                        }
                        className="w-full rounded-xl border border-[#7199C3] bg-[#1F4A85] px-4 py-3 text-white"
                    >
                        {healthSystems.map((system) => (
                            <option
                                key={system.id}
                                value={system.id}
                            >
                                {system.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="healthMetric"
                        className="mb-2 block text-sm font-medium"
                    >
                        Health Metric
                    </label>

                    <select
                        id="healthMetric"
                        value={selectedMetric}
                        onChange={(event) =>
                            setSelectedMetric(event.target.value)
                        }
                        className="w-full rounded-xl border border-[#7199C3] bg-[#1F4A85] px-4 py-3 text-white"
                    >
                        {availableMetrics.map((metric) => (
                            <option
                                key={metric.id}
                                value={metric.id}
                            >
                                {metric.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Historical time-range controls. */}
            <div
                className="mt-4 flex flex-wrap items-center gap-3"
                aria-label="Time range"
            >
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
                        className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
                            selectedRange === range.days
                                ? 'border-[#F0B429] bg-[#F0B429] text-[#102B4C]'
                                : 'border-[#7199C3] bg-[#1F4A85] text-white'
                        }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Mission history and selected metric. */}
            <div className="mb-3 mt-6">
                <p className="text-sm italic text-[#C1D2E7]">
                    {trendsLoading
                        ? 'Loading mission history...'
                        : firstDay !== undefined &&
                          lastDay !== undefined
                            ? `Available mission days ${firstDay} to ${lastDay}`
                            : 'Mission history unavailable'}
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    {activeMetric?.label ?? 'Health metric'}
                </h2>
            </div>

            {/* Reuse HALO's existing responsive trend chart. */}
            {trendsLoading ? (
                <p
                    role="status"
                    className="text-[#A8BDD6]"
                >
                    Loading health trends...
                </p>
            ) : trendsError ? (
                <p
                    role="alert"
                    className="text-[#F03333]"
                >
                    {trendsError}
                </p>
            ) : (
                <TrendsChart data={selectedTrendData} />
            )}

            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#C1D2E7] sm:text-sm">
                <span>
                    Dashed lines: simulated personal baseline and bounds
                </span>

                <span className="text-[#A8BDD6]">
                    Flagged days: highlighted below
                </span>
            </div>

            {/* Highlight the latest non-GREEN metric reading. */}
            {!trendsLoading && !trendsError && latestFlag && (
                <div
                    className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-l-[7px] bg-linear-to-br from-[#24538B] to-[#173A6B] px-5 py-5 shadow-lg ${
                        latestFlag.severity === 'RED'
                            ? 'border-[#FF6472]'
                            : 'border-[#F0B429]'
                    }`}
                    role="status"
                >
                    <span className="text-lg">
                        Day {latestFlag.day}
                    </span>

                    <span
                        className={`font-semibold ${
                            latestFlag.severity === 'RED'
                                ? 'text-[#FF6472]'
                                : 'text-[#F0B429]'
                        }`}
                    >
                        {latestFlag.severity} · Flagged simulated reading
                    </span>
                </div>
            )}

            {/* Explain limited mission history. */}
            {!trendsLoading &&
                !trendsError &&
                selectedTrendData &&
                daysAvailable < selectedRange && (
                    <p className="mt-3 text-sm text-[#C1D2E7]">
                        Only {daysAvailable} simulated mission days
                        are available for this metric.
                    </p>
                )}

            <p className="mt-6 text-center text-xs italic text-[#C1D2E7]">
                Simulated mission data for demonstration purposes.
                Not actual astronaut health measurements.
            </p>

            <p className="mt-2 text-center text-xs italic text-[#C1D2E7]">
                Decision support prototype. Not a medical device.
            </p>
        </main>
    )
}

export default Trends
