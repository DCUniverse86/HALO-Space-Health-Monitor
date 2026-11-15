import type { Severity } from '../types/api'
import { AlertTriangle, Droplet, HeartPulse, Moon, Smile, } from 'lucide-react'

interface AssessmentResultsProps {
    severity: Severity
    onDone: () => void
}

const cardClass = 'rounded-2xl bg-linear-to-b from-[#24538B] to-[#173A6B] p-5 shadow-lg'

// The three screenshot scenarios are visual examples, not interpretations of check-in inputs.
function AssessmentResults({ severity, onDone }: AssessmentResultsProps) {
    const green = severity === 'GREEN'
    const yellow = severity === 'YELLOW'
    const color = green ? '#4CC38A' : yellow ? '#F0B429' : '#FF6472'

    return (
        <section className="mx-auto w-full max-w-4xl text-white">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-[0.14em]">HALO</h1>
                    <p className="mt-2 text-sm italic text-[#C4D4E6]">
                        Commander Alex · {severity === 'RED' ? 'Mission day 130' : 'Mission day 75'}
                    </p>
                    {yellow && <p className="mt-1 text-sm italic text-[#C4D4E6]">No connection to Earth</p>}
                </div>
            </header>

            <div className="mt-7 flex items-center gap-4 sm:gap-6">
                {/* Lightweight robot illustration, until the approved artwork is wired in. */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[3px] bg-[#DCE7F4] shadow-lg sm:h-28 sm:w-28"
                    style={{ borderColor: color }} role="img" aria-label={`HALO robot, ${severity} status`}>
                    <div className="relative h-14 w-[72px] rounded-[25px] border-[5px] border-[#789FC7] bg-[#12355D] sm:h-16 sm:w-[84px]">
                        <span className="absolute left-4 top-4 h-2 w-2 rounded-full bg-[#F0B429]" />
                        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#F0B429]" />
                        <span className="absolute bottom-2 left-1/2 h-3 w-6 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#F0B429]" />
                    </div>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2" style={{ color }}>
                        {severity === 'RED' && <AlertTriangle size={22} aria-hidden="true" />}
                        <h2 className="text-2xl font-bold sm:text-3xl">{severity}</h2>
                    </div>
                    <p className="mt-1 text-base sm:text-lg">
                        {green ? 'Your latest readings are within your usual range.' :
                            yellow ? 'Changes worth reviewing.' : 'Act now. Cabin air alert.'}
                    </p>
                    <p className="mt-2 text-sm text-[#C4D4E6]">
                        {severity === 'RED' ? 'Elevated cabin CO₂ detected. Headache reported.' : 'Last check-in: Today, 08:00'}
                    </p>
                </div>
            </div>

            {severity === 'RED' ? (
                <div className="mt-7 space-y-4">
                    <div className={`${cardClass} border-l-[7px] border-[#FF6472]`}>
                        <h3 className="flex items-center gap-2 text-xl"><AlertTriangle size={20} color={color} /> Cabin air · RED alert</h3>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div><dt className="inline text-[#C4D4E6]">CO₂ reading: </dt><dd className="inline font-bold text-[#FF6472]">Above configured mission limit</dd></div>
                            <div><dt className="inline text-[#C4D4E6]">Symptoms: </dt><dd className="inline font-bold text-[#FF6472]">Headache reported</dd></div>
                            <div><dt className="inline text-[#C4D4E6]">Detected: </dt><dd className="inline">Today, 08:05</dd></div>
                        </dl>
                        <p className="mt-3 text-xs text-[#C4D4E6]">Demonstration scenario · Simulated sensor data</p>
                    </div>
                    <div className={cardClass}>
                        <h3 className="text-xl font-semibold">What to do now</h3>
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed sm:text-base">
                            <li>Notify the crew and crew medical officer now.</li>
                            <li>Follow the onboard cabin-air emergency procedure.</li>
                            <li>Record symptoms and actions taken.</li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div className="mt-7 space-y-4">
                    <div className={cardClass}>
                        <h3 className="text-xl font-bold">Today’s readings</h3>
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                            <div>
                                <HeartPulse size={18} className="text-[#B9D1EC]" aria-hidden="true" />
                                <p className="mt-1 text-sm text-[#C4D4E6]">Resting heart rate</p>
                                <p className="mt-1 text-2xl font-bold">{green ? '62' : '71'} bpm</p>
                                <p className={`mt-1 text-xs ${yellow ? 'text-[#F0B429]' : 'text-[#C4D4E6]'}`}>
                                    {green ? 'Within your baseline' : '↑ 9 bpm above baseline'}
                                </p>
                            </div>
                            <div>
                                <Droplet size={18} className="text-[#B9D1EC]" aria-hidden="true" />
                                <p className="mt-1 text-sm text-[#C4D4E6]">Blood oxygen</p>
                                <p className="mt-1 text-2xl font-bold">98%</p>
                                <p className="mt-1 text-xs text-[#C4D4E6]">Within your baseline</p>
                            </div>
                            <div>
                                <Moon size={18} className="text-[#B9D1EC]" aria-hidden="true" />
                                <p className="mt-1 text-sm text-[#C4D4E6]">Sleep</p>
                                <p className="mt-1 text-2xl font-bold">{green ? '7 h 40 min' : '5 hours'}</p>
                                <p className={`mt-1 text-xs ${yellow ? 'text-[#F0B429]' : 'text-[#C4D4E6]'}`}>
                                    {green ? 'Near your usual duration' : '↓ 3 hours below baseline'}
                                </p>
                            </div>
                            <div>
                                <Smile size={18} className="text-[#B9D1EC]" aria-hidden="true" />
                                <p className="mt-1 text-sm text-[#C4D4E6]">Mood check-in</p>
                                <p className="mt-1 text-2xl font-bold">{green ? 'Good' : 'Not recorded'}</p>
                                <p className="mt-1 text-xs text-[#C4D4E6]">{green ? 'Reported today' : 'Complete your check-in'}</p>
                            </div>
                        </div>
                        <p className="mt-4 border-t border-[#7895B7]/40 pt-3 text-xs italic text-[#C4D4E6]">
                            Fictional demo readings. Personal comparisons, not universal healthy targets.
                        </p>
                    </div>
                    <div className={`${cardClass} ${green ? 'border-l-[3px] border-[#4CC38A]' : ''}`}>
                        {yellow && <span className="mb-3 inline-block rounded-md border border-[#A8BDD6] px-2 py-1 text-xs tracking-wider text-[#C4D4E6]">GENERATED LOCALLY</span>}
                        <h3 className="text-xl font-bold">{green ? 'Your daily overview' : 'Review your recent changes'}</h3>
                        <p className="mt-3 leading-relaxed">
                            {green ? 'No unusual changes were detected in the readings you shared.' :
                                'Your resting heart rate is above baseline, and your sleep is below baseline.'}
                        </p>
                    </div>
                </div>
            )}

            <p className="mt-5 text-center text-xs font-semibold text-[#F0B429]">
                DEMO PREVIEW — Not an assessment of your entered readings.
            </p>
            <button type="button" onClick={onDone}
                className="mt-4 w-full rounded-xl bg-[#F0B429] px-6 py-3 font-bold text-[#102B4C] hover:bg-[#FFD166]">
                Done
            </button>
            <p className="mt-5 text-center text-xs italic text-[#C4D4E6]">
                Decision support prototype. Not a medical device.
            </p>
        </section>
    )
}

export default AssessmentResults
