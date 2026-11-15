import { useState } from 'react'
import TrendsChart from '../components/TrendsChart'
import { demoTrendMetrics } from '../data/demoTrends'
import type { BodySystem } from '../types/api'

// HALO's five monitored health systems.
const healthSystems: { id: BodySystem; label: string }[] = [
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'immune', label: 'Immune' },
    { id: 'musculoskeletal', label: 'Musculoskeletal' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'environment', label: 'Environment' },
]

const timeRanges = [
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
    { days: 90, label: '90 Days' },
] as const

// Presents trends using the shared chart and HALO's Trends design.
function Trends() {
    const [selectedSystem, setSelectedSystem] =
        useState<BodySystem>('cardiovascular')
    const [selectedMetric, setSelectedMetric] =
        useState('resting_heart_rate')
    const [selectedRange, setSelectedRange] =
        useState<7 | 30 | 90>(30)

    const availableMetrics = demoTrendMetrics.filter(
        (metric) => metric.system === selectedSystem
    )

    const activeMetric = availableMetrics.find(
        (metric) => metric.id === selectedMetric
    )

    const changeSystem = (system: BodySystem) => {
        setSelectedSystem(system)

        const firstMetric = demoTrendMetrics.find(
            (metric) => metric.system === system
        )

        setSelectedMetric(firstMetric?.id ?? '')
    }

    const trendData = activeMetric?.data ?? null

    const latestDay = trendData?.points.length
        ? Math.max(...trendData.points.map((point) => point.day))
        : null

    const selectedTrendData = trendData && latestDay !== null
        ? {
            ...trendData,
            points: trendData.points.filter(
                (point) => point.day >= latestDay - selectedRange + 1
            ),
        }
        : trendData

    const flaggedPoints = selectedTrendData?.points.filter(
        (point) =>
            point.severity !== 'GREEN' && point.value !== null
    ) ?? []

    const latestFlag = flaggedPoints.length > 0
        ? flaggedPoints[flaggedPoints.length - 1]
        : null

    const firstDay = selectedTrendData?.points[0]?.day
    const lastDay =
        selectedTrendData?.points[
            selectedTrendData.points.length - 1
        ]?.day

    const daysAvailable = selectedTrendData?.points.length ?? 0

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

            {/* Select the historical time range. */}
            <div
                className="mt-4 flex flex-wrap items-center gap-3"
                aria-label="Time range"
            >
                {timeRanges.map((range) => (
                    <button
                        key={range.days}
                        type="button"
                        onClick={() => setSelectedRange(range.days)}
                        aria-pressed={selectedRange === range.days}
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
                    {firstDay !== undefined && lastDay !== undefined
                        ? `Available mission days ${firstDay} to ${lastDay}`
                        : 'Mission history unavailable'}
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    {activeMetric?.label ?? 'Health metric'}
                </h2>
            </div>

            {/* Reuse the same graph as the Home dashboard. */}
            <TrendsChart data={selectedTrendData} />

            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#C1D2E7] sm:text-sm">
                <span>
                    Dashed lines: simulated personal baseline and bounds
                </span>

                <span className="text-[#A8BDD6]">
                    Flagged days: highlighted below
                </span>
            </div>

            {/* Display the latest flagged demo reading. */}
            {latestFlag && (
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

                    
                    <span className={`font-semibold ${
                        latestFlag.severity === 'RED'
                            ? 'text-[#FF6472]'
                            : 'text-[#F0B429]'
                        }`}>

                        {latestFlag.severity === 'RED'
                            ? 'RED'
                            : 'YELLOW'} · Flagged demo reading
                    </span>
                </div>
            )}

            {/* Explain limited demo history. */}
            {selectedTrendData && daysAvailable < selectedRange && (
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