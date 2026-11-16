
import { useEffect, useState } from 'react'
import {
    AlertTriangle,
    ClipboardList,
    Radio,
    ShieldAlert,
} from 'lucide-react'
import { haloApi, ApiError } from '../api/client'
import type {
    AstronautStatus,
    EscalationResponse,
    HealthFlag,
} from '../types/api'

interface EscalationProps {
    onBack: () => void
    astronautId: string
    selectedDay: number
}

const cardClass =
    'min-w-0 rounded-2xl bg-linear-to-br from-[#24538B] to-[#173A6B] p-5 shadow-lg'

// Displays verified health concerns and submits escalation reports.
function Escalation({
    onBack,
    astronautId,
    selectedDay,
}: EscalationProps) {
    const [assessment, setAssessment] =
        useState<AstronautStatus | null>(null)

    const [selectedFlagId, setSelectedFlagId] =
        useState('')

    const [notes, setNotes] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [error, setError] =
        useState<string | null>(null)

    const [result, setResult] =
        useState<EscalationResponse | null>(null)

    // Retrieve verified health flags from Roman's engine.
    useEffect(() => {
        let active = true

        setIsLoading(true)
        setError(null)
        setAssessment(null)
        setSelectedFlagId('')
        setResult(null)

        haloApi.status(astronautId, selectedDay)
            .then((data) => {
                if (!active) return

                setAssessment(data)
                setSelectedFlagId(data.flags[0]?.id ?? '')
            })
            .catch((err: unknown) => {
                if (!active) return

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load health concerns.'
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
    }, [astronautId, selectedDay])

    const flags: HealthFlag[] =
        assessment?.astronaut_id === astronautId &&
        assessment?.day === selectedDay
            ? assessment.flags
            : []

    const selectedFlag = flags.find(
        (flag) => flag.id === selectedFlagId
    )

    // Submit a verified flag to Donte's escalation endpoint.
    const submitEscalation = async () => {
        if (
            !selectedFlag ||
            isSubmitting ||
            result !== null
        ) {
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await haloApi.escalate(
                astronautId,
                {
                    day: selectedDay,
                    flag_id: selectedFlag.id,
                    reason: notes.trim() ||
                        selectedFlag.explanation,
                }
            )

            if (!response.success) {
                throw new Error(
                    'The backend did not confirm the escalation report.'
                )
            }

            setResult(response)
        } catch (err: unknown) {
            if (
                err instanceof ApiError &&
                err.status === 409
            ) {
                setError(
                    'An escalation report already exists for this astronaut and mission day.'
                )
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to create escalation report.'
                )
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const astronautName =
        assessment?.astronaut_name ??
        astronautId.charAt(0).toUpperCase() +
            astronautId.slice(1)

    return (
        <main className="mx-auto w-full max-w-5xl pb-28 text-white">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#F0B429]">
                        SIMULATED MISSION
                    </p>

                    <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                        Medical Escalation
                    </h1>

                    <p className="mt-2 text-sm text-[#B9C9DD]">
                        Review health concerns for the Crew Medical Officer.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-xl border border-[#7895B7] bg-[#1F4A85] px-4 py-2 text-sm font-semibold"
                >
                    Back
                </button>
            </header>

            <div
                className="mt-5 rounded-2xl border border-[#F0B429] bg-[#173A6B] p-4 text-sm leading-relaxed text-[#E4EDF7]"
                role="note"
            >
                HALO is a research prototype. Escalation reports
                are created in the backend demonstration system.
                A queued report does not confirm delivery to
                Mission Control or a medical officer.
                For real emergencies, follow established procedures.
            </div>

            {isLoading && (
                <p role="status" className="mt-5 text-[#B9C9DD]">
                    Loading health concerns...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="mt-5 rounded-xl bg-[#102B4C] p-4 text-[#FF6472]"
                >
                    {error}
                </p>
            )}

            {!isLoading && (
                <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                    <section className={cardClass}>
                        <h2 className="flex items-center gap-2 text-xl font-bold">
                            <ClipboardList
                                size={22}
                                className="text-[#F0B429]"
                                aria-hidden="true"
                            />
                            Escalation Summary
                        </h2>

                        <dl className="mt-4 space-y-3 text-sm sm:text-base">
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#B9C9DD]">
                                    Astronaut
                                </dt>
                                <dd>{astronautName}</dd>
                            </div>

                            <div className="flex justify-between gap-3">
                                <dt className="text-[#B9C9DD]">
                                    Mission day
                                </dt>
                                <dd>{selectedDay}</dd>
                            </div>

                            <div className="flex justify-between gap-3">
                                <dt className="text-[#B9C9DD]">
                                    Overall status
                                </dt>
                                <dd>
                                    {assessment?.overall_severity ??
                                        'Unavailable'}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-5 border-t border-[#7895B7]/40 pt-4">
                            <label
                                htmlFor="escalationFlag"
                                className="block font-semibold"
                            >
                                Select a Verified Health Concern
                            </label>

                            {flags.length === 0 ? (
                                <p className="mt-3 text-sm text-[#B9C9DD]">
                                    No health flags are available for
                                    this astronaut and mission day.
                                    Escalation cannot be submitted
                                    without a verified flag.
                                </p>
                            ) : (
                                <>
                                    <select
                                        id="escalationFlag"
                                        value={selectedFlagId}
                                        onChange={(event) => {
                                            setSelectedFlagId(
                                                event.target.value
                                            )
                                            setResult(null)
                                        }}
                                        disabled={result !== null}
                                        className="mt-3 w-full rounded-xl border border-[#7895B7] bg-[#102B4C] p-3 text-sm text-white"
                                    >
                                        {flags.map((flag) => (
                                            <option
                                                key={flag.id}
                                                value={flag.id}
                                            >
                                                {flag.system} · {flag.severity}
                                                {' · '}{flag.code}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedFlag && (
                                        <div className="mt-4 rounded-xl bg-[#102B4C] p-4">
                                            <p className="font-semibold">
                                                {selectedFlag.severity}
                                                {' · '}
                                                {selectedFlag.system}
                                            </p>

                                            <p className="mt-2 text-sm leading-relaxed text-[#DCE7F4]">
                                                {selectedFlag.explanation}
                                            </p>

                                            <p className="mt-2 break-all text-xs text-[#B9C9DD]">
                                                Flag ID: {selectedFlag.id}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <label
                            htmlFor="escalationNotes"
                            className="mt-5 block text-sm font-semibold"
                        >
                            Reason or Additional Notes
                        </label>

                        <textarea
                            id="escalationNotes"
                            value={notes}
                            onChange={(event) =>
                                setNotes(event.target.value)
                            }
                            disabled={result !== null}
                            rows={4}
                            placeholder="Enter relevant observations..."
                            className="mt-2 w-full resize-y rounded-xl border border-[#7895B7] bg-[#102B4C] p-3 text-sm text-white placeholder:text-[#A8BDD6]"
                        />
                    </section>

                    <section className="min-w-0 space-y-4">
                        <div className={cardClass}>
                            <h2 className="flex items-center gap-2 text-xl font-bold">
                                <ShieldAlert
                                    size={22}
                                    className="text-[#F0B429]"
                                    aria-hidden="true"
                                />
                                Crew Medical Officer
                            </h2>

                            <p className="mt-3 text-sm leading-relaxed text-[#DCE7F4]">
                                Intended recipient of the escalation
                                report.
                            </p>

                            <p className="mt-3 text-sm font-semibold text-[#F0B429]">
                                {result
                                    ? `Recipient: ${result.recipient}`
                                    : 'Not contacted'}
                            </p>
                        </div>

                        <div className={cardClass}>
                            <h2 className="flex items-center gap-2 text-xl font-bold">
                                <Radio
                                    size={22}
                                    className="text-[#F0B429]"
                                    aria-hidden="true"
                                />
                                Mission Control
                            </h2>

                            <p className="mt-3 text-sm leading-relaxed text-[#DCE7F4]">
                                Backend escalation status.
                                Queueing does not guarantee transmission.
                            </p>

                            <p className="mt-3 text-sm font-semibold text-[#F0B429]">
                                {result
                                    ? result.mission_control_status
                                    : 'Not queued'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={submitEscalation}
                            disabled={
                                isLoading ||
                                isSubmitting ||
                                !selectedFlag ||
                                result !== null
                            }
                            className="w-full rounded-xl bg-[#F0B429] px-5 py-3 font-bold text-[#102B4C] hover:bg-[#FFD166] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? 'Creating Escalation Report...'
                                : 'Create Escalation Report'}
                        </button>

                        {result && (
                            <div
                                role="status"
                                className="rounded-2xl border border-[#7895B7] bg-[#102B4C] p-4 text-sm"
                            >
                                <p className="font-semibold text-[#4CC38A]">
                                    Escalation Report Created
                                </p>

                                <p className="mt-2 break-all text-[#DCE7F4]">
                                    Report ID: {result.report_id}
                                </p>

                                <p className="mt-2 text-[#DCE7F4]">
                                    Severity: {result.severity}
                                </p>

                                <p className="mt-2 text-[#DCE7F4]">
                                    Queue status:
                                    {' '}{result.mission_control_status}
                                </p>

                                <p className="mt-3 text-xs text-[#F0B429]">
                                    Report saved by HALO's backend.
                                    Delivery has not been confirmed.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            <p className="mt-6 flex items-start gap-2 text-xs italic text-[#B9C9DD]">
                <AlertTriangle
                    size={16}
                    className="shrink-0"
                    aria-hidden="true"
                />
                HALO is a decision-support prototype,
                not a certified medical device.
            </p>
        </main>
    )
}

export default Escalation
    