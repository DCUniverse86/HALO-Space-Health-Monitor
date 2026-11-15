import { useState } from 'react'
import TrendsChart from '../components/TrendsChart'
import { demoTrendMetrics } from '../data/demoTrends'
import type { BodySystem } from '../types/api'

// Display names for HALO's five monitored health systems.
const healthSystems: { id: BodySystem; label: string }[] = [
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'immune', label: 'Immune' },
    { id: 'musculoskeletal', label: 'Musculoskeletal' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'environment', label: 'Environment' },
]

// Available time ranges for HALO's health trends.
const timeRanges = [
    {days: 7, label:  '7 Days'},
    {days: 30, label:  '30 Days'},
    {days: 90, label:  '90 Days'},
] as const
// Displays HALO's astronaut health trends page.
function Trends() {
    // Track the selected health system.
    const [selectedSystem, setSelectedSystem] =
        useState<BodySystem>('cardiovascular')

    // Track the selected health metric.
    const [selectedMetric, setSelectedMetric] =
        useState('resting_heart_rate')

    // Find metrics belonging to the selected health system.
    const availableMetrics = demoTrendMetrics.filter(
        (metric) => metric.system === selectedSystem
    )

    // Find the selected metric and its trend data.
    const activeMetric = availableMetrics.find(
        (metric) => metric.id === selectedMetric
    )

    // Track the selected trend time range
    const [selectedRange, setSelectedRange] = useState<7 | 30 | 90>(7)

    // Switch health systems and select their first metric.
    const changeSystem = (system: BodySystem) => {
        setSelectedSystem(system)

        const firstMetric = demoTrendMetrics.find(
            (metric) => metric.system === system
        )

        setSelectedMetric(firstMetric?.id ?? '')
    }


    // Get the selected metric's available trend data.
    const trendData = activeMetric?.data ?? null

    // Find the latest mission day with available measurements.
    const latestDay = trendData?.points.length
        ? Math.max(...trendData.points.map((point) => point.day))
        : null

    // Filter measurements using the selected time range.
    const selectedTrendData =
        trendData && latestDay !== null
            ? {
                ...trendData,
                points: trendData.points.filter(
                    (point) => point.day >= latestDay - selectedRange + 1
                ),
            }
            : trendData


    return (
        <main className="w-full text-white">
            {/* Trends page heading */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold">
                    Health Trends
                </h1>

                <p className="mt-2 text-sm text-[#A8BDD6]">
                    Monitor changes across HALO's five health systems.
                </p>
            </header>

            {/* Arrange trend filters side by side on larger screens. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Health system selection */}
                <section className="mb-5">
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
                        changeSystem(event.target.value as BodySystem)
                    }
                    className="w-full rounded-xl border border-[#A8BDD6] bg-[#1F4A85] px-4 py-3 text-white"
                >
                    {healthSystems.map((system) => (
                        <option key={system.id} value={system.id}>
                            {system.label}
                        </option>
                    ))}
                </select>
            </section>

            {/* Health metric selection */}
            <section className="mb-6">
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
                    className="w-full rounded-xl border border-[#A8BDD6] bg-[#1F4A85] px-4 py-3 text-white"
                >
                    {availableMetrics.map((metric) => (
                        <option key={metric.id} value={metric.id}>
                            {metric.label}
                        </option>
                    ))}
                </select>
            </section>
            </div>

            
            {/* Select the historical time range. */}
            <section className="mb-6">
                <h2 className="mb-3 text-sm font-medium">
                    Time Range
                </h2>
                <div className="flex flex-wrap gap-3">
                    {timeRanges.map((range) => (
                    <button
                        key={range.days}
                        type="button"
                        onClick={() => setSelectedRange(range.days)}
                        aria-pressed={selectedRange === range.days}
                        className={`rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
                        selectedRange === range.days
                            ? 'border-[#F0B429] bg-[#F0B429] text-[#102B4C]'
                            : 'border-[#A8BDD6] bg-[#1F4A85] text-white'
                        }`}
                    >
                    {range.label}
                    </button>
                ))}
                </div>
                </section>
                    
                    {/* Reuse the shared Home dashboard graph. */}
                    <TrendsChart data={selectedTrendData} />
                    {/* Explain when the selected range exceeds available demo history. */}
                    {selectedTrendData && selectedRange > 7 && (
                        <p className="mt-3 text-center text-sm text-[#A8BDD6]">
                            Only seven mission days of simulated measurements
                            are currently available for this metric.
                        </p>
                    )}

                    {/* Clearly identify simulated measurements. */}
                    <p className="mt-4 text-center text-sm text-[#A8BDD6]">
                        Simulated mission data for demonstration purposes.
                        Not actual astronaut health measurements.
                    </p>
        </main>
            )
        }

export default Trends