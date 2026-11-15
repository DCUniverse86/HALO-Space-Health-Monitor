
import { useState } from 'react'
import { Activity, HeartPulse } from 'lucide-react'
import TrendsChart from '../components/TrendsChart'
import { demoTrends } from '../data/demoTrends'

// Time ranges available for the Vitals graph.
const timeRanges = [
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
    { days: 90, label: '90 Days' },
] as const

// Displays HALO's dedicated astronaut Vitals dashboard.
function Vitals() {
    // Track the selected graph time range.
    const [selectedRange, setSelectedRange] =
        useState<7 | 30 | 90>(7)

    // Track whether Vitals or History is selected.
    const [activeTab, setActiveTab] =
        useState<'vitals' | 'history'>('vitals')

    // Find the most recent simulated measurement.
    const latestPoint = demoTrends.points[
        demoTrends.points.length - 1
    ]

    // Filter measurements using the selected time range.
    const latestDay = latestPoint?.day ?? 0

    const filteredTrends = {
        ...demoTrends,
        points: demoTrends.points.filter(
            (point) =>
                point.day >= latestDay - selectedRange + 1
        ),
    }

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
                    Commander Alex · Mission Day 75
                </p>

                <p className="mt-2 text-xs text-[#A8BDD6]">
                    DEMO DATA — Simulated measurements
                </p>
            </header>

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
                                {latestPoint?.value ?? '--'} bpm
                            </p>

                            <p className="mt-2 text-sm text-[#F0B429]">
                                YELLOW · Demo flagged reading
                            </p>
                        </section>

                        <section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg">
                            <h2 className="font-semibold">
                                Blood Oxygen
                            </h2>

                            <p className="mt-4 text-3xl font-bold">
                                98%
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
                                Not recorded
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
                        <TrendsChart data={filteredTrends} />
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

                    {selectedRange > 7 && (
                        <p className="mt-3 text-sm text-[#A8BDD6]">
                            Only seven mission days of simulated
                            measurements are currently available.
                        </p>
                    )}
                </>
            ) : (
                <section className="rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5">
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

                    <p className="mt-4 text-[#A8BDD6]">
                        Historical vital measurements will be
                        available when backend integration is complete.
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
