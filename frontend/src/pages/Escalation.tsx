import { useState } from 'react'
import { AlertTriangle, ClipboardList, Radio, ShieldAlert } from 'lucide-react'
import type { Severity } from '../types/api'

interface EscalationProps {
    onBack: () => void
    astronautName?: string
    missionDay?: number
    severity?: Severity | null
    concern?: string
    flagId?: string | null
}

// Presentation-only escalation review. No report is transmitted or queued.
function Escalation({
    onBack,
    astronautName = 'Commander Alex',
    missionDay = 75,
    severity = null,
    concern = '',
    flagId = null,
}: EscalationProps) {
    const [notes, setNotes] = useState('')
    const [previewed, setPreviewed] = useState(false)

    return (
        <main className="mx-auto w-full max-w-5xl pb-28 text-white">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#F0B429]">DEMO ONLY</p>
                    <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Medical Escalation</h1>
                    <p className="mt-2 text-sm text-[#B9C9DD]">Review information for the Crew Medical Officer.</p>
                </div>
                <button type="button" onClick={onBack}
                    className="rounded-xl border border-[#7895B7] bg-[#1F4A85] px-4 py-2 text-sm font-semibold">
                    Back
                </button>
            </header>

            <div className="mt-5 rounded-2xl border border-[#F0B429] bg-[#173A6B] p-4 text-sm leading-relaxed text-[#E4EDF7]" role="note">
                <strong>Preview only.</strong> No medical report is sent to a crew member or Mission Control,
                and nothing is placed in a transmission queue. For real emergencies, follow established mission procedures.
            </div>

            <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <section className="min-w-0 rounded-2xl bg-linear-to-br from-[#24538B] to-[#173A6B] p-5 shadow-lg">
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                        <ClipboardList size={22} className="text-[#F0B429]" aria-hidden="true" />
                        Escalation summary
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm sm:text-base">
                        <div className="flex flex-wrap justify-between gap-2"><dt className="text-[#B9C9DD]">Astronaut</dt><dd>{astronautName}</dd></div>
                        <div className="flex flex-wrap justify-between gap-2"><dt className="text-[#B9C9DD]">Mission day</dt><dd>{missionDay}</dd></div>
                        <div className="flex flex-wrap justify-between gap-2"><dt className="text-[#B9C9DD]">Severity</dt><dd className={severity === 'RED' ? 'font-bold text-[#FF6472]' : severity === 'YELLOW' ? 'font-bold text-[#F0B429]' : 'text-[#DCE7F4]'}>{severity ?? 'Not available'}</dd></div>
                        <div className="flex flex-wrap justify-between gap-2"><dt className="text-[#B9C9DD]">Flag ID</dt><dd className="break-all">{flagId ?? 'Not available'}</dd></div>
                    </dl>
                    <div className="mt-5 border-t border-[#7895B7]/40 pt-4">
                        <h3 className="font-semibold">Flagged concern</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#DCE7F4]">{concern || 'No verified health concern has been provided to this preview.'}</p>
                    </div>
                    <label htmlFor="escalationNotes" className="mt-5 block text-sm font-semibold">Additional notes (local preview)</label>
                    <textarea id="escalationNotes" value={notes} onChange={(event) => { setNotes(event.target.value); setPreviewed(false) }}
                        rows={4} placeholder="Enter relevant observations for the report preview"
                        className="mt-2 w-full resize-y rounded-xl border border-[#7895B7] bg-[#102B4C] p-3 text-sm text-white placeholder:text-[#A8BDD6]" />
                </section>

                <section className="min-w-0 space-y-4">
                    <div className="rounded-2xl bg-linear-to-br from-[#24538B] to-[#173A6B] p-5 shadow-lg">
                        <h2 className="flex items-center gap-2 text-xl font-bold"><ShieldAlert size={22} className="text-[#F0B429]" aria-hidden="true" />Crew Medical Officer</h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#DCE7F4]">Intended recipient of the escalation summary. Contact and delivery functionality are pending backend integration.</p>
                        <p className="mt-3 text-sm font-semibold text-[#F0B429]">Not contacted</p>
                    </div>
                    <div className="rounded-2xl bg-linear-to-br from-[#24538B] to-[#173A6B] p-5 shadow-lg">
                        <h2 className="flex items-center gap-2 text-xl font-bold"><Radio size={22} className="text-[#F0B429]" aria-hidden="true" />Mission Control</h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#DCE7F4]">When the backend is available, an escalation report may be queued for delayed synchronization according to the mission workflow.</p>
                        <p className="mt-3 text-sm font-semibold text-[#F0B429]">Not queued or transmitted</p>
                    </div>
                    <button type="button" onClick={() => setPreviewed(true)}
                        className="w-full rounded-xl bg-[#F0B429] px-5 py-3 font-bold text-[#102B4C] hover:bg-[#FFD166]">
                        Preview escalation packet
                    </button>
                    {previewed && (
                        <div role="status" className="rounded-2xl border border-[#7895B7] bg-[#102B4C] p-4 text-sm">
                            <p className="font-semibold">Local packet preview ready</p>
                            <p className="mt-2 text-[#DCE7F4]">Recipient: Crew Medical Officer</p>
                            <p className="mt-1 text-[#DCE7F4]">Concern: {concern || 'Not provided'}</p>
                            <p className="mt-1 whitespace-pre-wrap text-[#DCE7F4]">Notes: {notes.trim() || 'None entered'}</p>
                            <p className="mt-2 text-[#F0B429]">Not submitted, saved, or queued.</p>
                        </div>
                    )}
                </section>
            </div>
            <p className="mt-6 flex items-start gap-2 text-xs italic text-[#B9C9DD]"><AlertTriangle size={16} className="shrink-0" aria-hidden="true" />HALO is a decision-support prototype, not a certified medical device.</p>
        </main>
    )
}

export default Escalation
