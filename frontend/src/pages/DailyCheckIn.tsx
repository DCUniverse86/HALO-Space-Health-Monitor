import { useState } from 'react'
import type { CheckInRequest } from '../types/api'
import { haloApi, ApiError } from '../api/client'
import type { CheckInResponse } from '../types/api'

const symptomOptions = [
    'Fatigue',
    'Headache',
    'Back Pain',
    'Fever',
    'None',
]

const sleepOptions = [
    'Under 5 Hours',
    '5 to under 6 Hours',
    '6 to under 7 Hours',
    '7 to 8 Hours',
    'Over 8 Hours',
]

const moodOptions = Array.from(
    { length: 10 },
    (_, index) => index + 1
)

const levelOptions = Array.from(
    { length: 11 },
    (_, index) => index
)

type VitalKey =
    | 'restingHeartRate'
    | 'bloodOxygen'
    | 'temperature'
    | 'systolic'
    | 'diastolic'

type Vitals = Record<VitalKey, string>

const initialVitals: Vitals = {
    restingHeartRate: '',
    bloodOxygen: '',
    temperature: '',
    systolic: '',
    diastolic: '',
}

const inputStyle =
    'h-9 min-w-0 w-full rounded-lg border border-[#31577D] bg-[#0C294A] px-3 text-sm text-white outline-none placeholder:text-[#91A8C2] focus:border-[#F0B429]'

const cardStyle =
    'rounded-[20px] border border-[#31577D]/40 bg-linear-to-b from-[#214E85] to-[#173C70] p-4 shadow-lg'

// Identifies the astronaut and mission day selected in HALO.
interface DailyCheckInProps {
    astronautId: string
    selectedDay: number
}

// Displays HALO's three-step Daily Check-In.
function DailyCheckIn({
    astronautId,
    selectedDay,
}: DailyCheckInProps) {
    const [formData, setFormData] =
        useState<Partial<CheckInRequest>>({})

    const [selectedSleep, setSelectedSleep] =
        useState<string | null>(null)

	// Track which step of Daily Check-In is displayed.
    const [currentStep, setCurrentStep] = useState<number>(1)

        // Track real backend check-in submissions.
    const [checkInResult, setCheckInResult] =
        useState<CheckInResponse | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)

    const [submissionError, setSubmissionError] =
        useState<string | null>(null)

    // Additional wellness questions required by Donte's API.
    const [sleepQuality, setSleepQuality] =
        useState<number | null>(null)

    const [stress, setStress] =
        useState<number | null>(null)

    const [fatigue, setFatigue] =
        useState<number | null>(null)

    const [painLevel, setPainLevel] =
        useState<number | null>(null)

    const [painLocation, setPainLocation] = useState('')
    const [notes, setNotes] = useState('')

    // Local vital-sign entry state.
    const [measurementContext, setMeasurementContext] =
        useState<'resting' | 'after_activity'>('resting')

    const [recordedAt, setRecordedAt] = useState('')

    const [vitals, setVitals] =
        useState<Vitals>(initialVitals)

    const [readingsSaved, setReadingsSaved] = useState(false)

    const updateMood = (mood: number) => {
        setFormData((previous) => ({
            ...previous,
            mood,
        }))
    }

    const toggleSymptom = (symptom: string) => {
        setFormData((previous) => {
            const current = previous.symptoms ?? []

            if (symptom === 'None') {
                return {
                    ...previous,
                    symptoms: current.includes('None')
                        ? []
                        : ['None'],
                }
            }

            const other = current.filter(
                (item) => item !== 'None'
            )

            return {
                ...previous,
                symptoms: other.includes(symptom)
                    ? other.filter((item) => item !== symptom)
                    : [...other, symptom],
            }
        })
    }

    const updateVital = (
        field: VitalKey,
        value: string
    ) => {
        setVitals((previous) => ({
            ...previous,
            [field]: value,
        }))

        setReadingsSaved(false)
    }

    const isValidOptionalPositive = (value: string) =>
        value.trim() === '' ||
        (
            Number.isFinite(Number(value)) &&
            Number(value) > 0
        )

    const hasVitalReading = Object.values(vitals).some(
        (value) => value.trim() !== ''
    )

    const areVitalsValid =
        isValidOptionalPositive(vitals.restingHeartRate) &&
        isValidOptionalPositive(vitals.temperature) &&
        isValidOptionalPositive(vitals.systolic) &&
        isValidOptionalPositive(vitals.diastolic) &&
        (
            vitals.bloodOxygen.trim() === '' ||
            (
                Number(vitals.bloodOxygen) > 0 &&
                Number(vitals.bloodOxygen) <= 100
            )
        ) &&
        (
            vitals.systolic === '' ||
            vitals.diastolic === '' ||
            Number(vitals.systolic) >
                Number(vitals.diastolic)
        )

    // Require all wellness questions before continuing.
    const isStepOneComplete =
        selectedSleep !== null &&
        formData.mood != null &&
        (formData.symptoms?.length ?? 0) > 0 &&
        sleepQuality !== null &&
        stress !== null &&
        fatigue !== null &&
        painLevel !== null &&
        (
            painLevel === 0 ||
            painLocation.trim().length > 0
        )

    
    // Submit wellness answers to Donte's FastAPI backend.
    const submitCheckIn = async () => {
        if (
            !isStepOneComplete ||
            formData.mood == null ||
            sleepQuality === null ||
            stress === null ||
            fatigue === null ||
            painLevel === null ||
            isSubmitting ||
            checkInResult !== null
        ) {
            return
        }

        // Donte's endpoint accepts wellness information only.
        // Step 2 vital readings are not included in this request.
        const requestData: CheckInRequest = {
            day: selectedDay,
            sleep_quality: sleepQuality,
            mood: formData.mood,
            stress,
            fatigue,
            pain: {
                level: painLevel,
                location: painLevel > 0
                    ? painLocation.trim()
                    : '',
            },
            symptoms: (formData.symptoms ?? [])
                .filter((symptom) => symptom !== 'None')
                .map((symptom) =>
                    symptom.toLowerCase().replace(/\s+/g, '_')
                ),
            notes,
        }

        setIsSubmitting(true)
        setSubmissionError(null)

        try {
            const response = await haloApi.checkin(
                astronautId,
                requestData
            )

            if (!response.success) {
                throw new Error(
                    'The backend did not confirm the check-in was saved.'
                )
            }

            setCheckInResult(response)
            setCurrentStep(3)
        } catch (error: unknown) {
            if (
                error instanceof ApiError &&
                error.status === 409
            ) {
                setSubmissionError(
                    'A check-in already exists for this astronaut and mission day.'
                )
            } else {
                setSubmissionError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to submit the daily check-in.'
                )
            }
        } finally {
            setIsSubmitting(false)
        }
    }

	
		// Reset the local demonstration after completion.
    const finishCheckIn = () => {
        setCurrentStep(1)
        setFormData({})
        setSelectedSleep(null)
        setSleepQuality(null)
        setStress(null)
        setFatigue(null)
        setPainLevel(null)
        setPainLocation('')
        setNotes('')
        setVitals({ ...initialVitals })
        setMeasurementContext('resting')
        setRecordedAt('')
        setReadingsSaved(false)
		setCheckInResult(null)
		setSubmissionError(null)
    }

    // Shared numbered rating buttons.
    const ratingButtons = (
        values: number[],
        selectedValue: number | null,
        onSelect: (value: number) => void
    ) => (
        <div className="mt-4 flex flex-wrap gap-3">
            {values.map((rating) => (
                <button
                    key={rating}
                    type="button"
                    onClick={() => onSelect(rating)}
                    aria-pressed={selectedValue === rating}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border font-medium ${
                        selectedValue === rating
                            ? 'border-[#F0B429] bg-[#F0B429] text-[#102B4C]'
                            : 'border-[#1F4A85] bg-[#1F4A85] text-white'
                    }`}
                >
                    {rating}
                </button>
            ))}
        </div>
    )

    // Shared vital-sign input rows.
    const vitalRow = (
        field: VitalKey,
        label: string,
        unit: string,
        max?: number
    ) => (
        <div className="mt-3" key={field}>
            <label
                htmlFor={field}
                className="mb-1 block text-sm text-white"
            >
                {label}
            </label>

            <div className="flex items-center gap-3">
                <input
                    id={field}
                    type="number"
                    min="0"
                    max={max}
                    step="any"
                    placeholder="Enter value"
                    value={vitals[field]}
                    onChange={(event) =>
                        updateVital(field, event.target.value)
                    }
                    className={inputStyle}
                />

                <span className="w-8 shrink-0 text-sm text-[#B9C9DD]">
                    {unit}
                </span>
            </div>
        </div>
    )

    return (
        <main
            className={
                currentStep === 2
                    ? 'mx-auto w-full max-w-6xl px-4 pb-28 pt-4 text-white sm:px-6 lg:px-8'
                    : 'mx-auto w-full max-w-3xl px-5 pb-24 pt-6 text-white'
            }
        >
            {/* STEP 1 — DAILY WELLNESS QUESTIONS */}
            {currentStep === 1 && (
                <>
                    <h1 className="text-2xl font-bold">
                        Daily Check-In
                    </h1>

                    <p className="mt-1 text-[#B9C9DD]">
                        Record your daily health information
                    </p>

                    <p className="mt-4 text-sm text-[#B9C9DD]">
                        Step 1 of 3
                    </p>

                    {/* Sleep duration */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            How Many Hours Did You Sleep?
                        </h2>

                        <div className="mt-4 flex flex-wrap gap-3">
                            {sleepOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() =>
                                        setSelectedSleep(option)
                                    }
                                    aria-pressed={
                                        selectedSleep === option
                                    }
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                        selectedSleep === option
                                            ? 'border-[#F0B429] bg-[#F0B429] text-[#102B4C]'
                                            : 'border-[#A8BDD6] bg-[#1F4A85] text-white'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Mood */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            How Would You Rate Your Mood?
                        </h2>

                        {ratingButtons(
                            moodOptions,
                            formData.mood ?? null,
                            updateMood
                        )}
                    </section>

                    {/* Symptoms */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            Are You Experiencing Any Symptoms?
                        </h2>

                        <div className="mt-4 flex flex-wrap gap-3">
                            {symptomOptions.map((symptom) => (
                                <button
                                    key={symptom}
                                    type="button"
                                    onClick={() =>
                                        toggleSymptom(symptom)
                                    }
                                    aria-pressed={
                                        formData.symptoms?.includes(
                                            symptom
                                        ) ?? false
                                    }
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                        formData.symptoms?.includes(
                                            symptom
                                        )
                                            ? 'border-[#F0B429] bg-[#F0B429] text-[#102B4C]'
                                            : 'border-[#1F4A85] bg-[#1F4A85] text-white'
                                    }`}
                                >
                                    {symptom}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Sleep quality */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            How Would You Rate Your Sleep Quality?
                        </h2>

                        <p className="mt-1 text-sm text-[#B9C9DD]">
                            1 = Very poor, 10 = Excellent
                        </p>

                        {ratingButtons(
                            moodOptions,
                            sleepQuality,
                            setSleepQuality
                        )}
                    </section>

                    {/* Stress */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            How Stressed Do You Feel?
                        </h2>

                        <p className="mt-1 text-sm text-[#B9C9DD]">
                            0 = No stress, 10 = Extreme stress
                        </p>

                        {ratingButtons(
                            levelOptions,
                            stress,
                            setStress
                        )}
                    </section>

                    {/* Fatigue */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            How Fatigued Do You Feel?
                        </h2>

                        <p className="mt-1 text-sm text-[#B9C9DD]">
                            0 = No fatigue, 10 = Extreme fatigue
                        </p>

                        {ratingButtons(
                            levelOptions,
                            fatigue,
                            setFatigue
                        )}
                    </section>

                    {/* Pain level and location */}
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold">
                            Are You Experiencing Pain?
                        </h2>

                        <p className="mt-1 text-sm text-[#B9C9DD]">
                            0 = No pain, 10 = Severe pain
                        </p>

                        {ratingButtons(
                            levelOptions,
                            painLevel,
                            (rating) => {
                                setPainLevel(rating)

                                if (rating === 0) {
                                    setPainLocation('')
                                }
                            }
                        )}

                        {painLevel !== null && painLevel > 0 && (
                            <div className="mt-4">
                                <label
                                    htmlFor="pain-location"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Where is the pain located?
                                </label>

                                <input
                                    id="pain-location"
                                    type="text"
                                    value={painLocation}
                                    onChange={(event) =>
                                        setPainLocation(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: Back, shoulder, knee"
                                    className={inputStyle}
                                />
                            </div>
                        )}
                    </section>

                    {/* Optional notes */}
                    <section className="mt-6">
                        <label
                            htmlFor="wellness-notes"
                            className="block text-lg font-semibold"
                        >
                            Anything Else You Would Like to Report?
                        </label>

                        <textarea
                            id="wellness-notes"
                            value={notes}
                            onChange={(event) =>
                                setNotes(event.target.value)
                            }
                            rows={3}
                            placeholder="Additional symptoms, concerns, or observations..."
                            className="mt-3 w-full rounded-lg border border-[#31577D] bg-[#0C294A] px-3 py-3 text-sm text-white outline-none placeholder:text-[#91A8C2] focus:border-[#F0B429]"
                        />
                    </section>

                    <button
                        type="button"
                        disabled={!isStepOneComplete}
                        onClick={() => setCurrentStep(2)}
                        className="mt-8 w-full rounded-xl bg-[#F0B429] px-6 py-4 font-bold text-[#102B4C] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </>
            )}

            {/* STEP 2 — ENTER VITALS */}
            {currentStep === 2 && (
                <>
                    <header className="relative pr-14">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                aria-label="Back to daily check-in"
                                className="flex h-8 w-7 items-center justify-center text-2xl text-white"
                            >
                                ←
                            </button>

                            <h1 className="text-[25px] font-bold leading-tight">
                                Enter Vitals
                            </h1>
                        </div>

                        {/* Preserve the existing HALO robot badge. */}
                        <div
                            aria-hidden="true"
                            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#8DA9C9] bg-[#DCE7F4] shadow-md"
                        >
                            <div className="relative flex h-8 w-9 items-center justify-center rounded-[14px] border-2 border-[#071D3A] bg-[#143C71]">
                                <span className="absolute left-[7px] top-[10px] h-[5px] w-[5px] rounded-full bg-[#F0B429]" />
                                <span className="absolute right-[7px] top-[10px] h-[5px] w-[5px] rounded-full bg-[#F0B429]" />
                                <span className="absolute bottom-[5px] h-[4px] w-[12px] rounded-b-full border-b-2 border-[#F0B429]" />
                            </div>
                        </div>

                        <p className="mt-3 text-sm italic text-[#B9C9DD]">
                            {astronautId.charAt(0).toUpperCase() + astronautId.slice(1)} · Mission day {selectedDay}
                        </p>

                        <p className="mt-1 text-sm text-[#B9C9DD]">
                            Enter readings from your measuring device.
                        </p>

                        <span className="mt-2 inline-block rounded-full border border-[#7895B7] px-2 py-0.5 text-[10px] tracking-[0.12em] text-[#B9C9DD]">
                            DEMO ENTRY
                        </span>
                    </header>

                    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <section className={cardStyle}>
                            <h2 className="text-xl font-bold">
                                Your measurements
                            </h2>

                            {vitalRow(
                                'restingHeartRate',
                                'Resting heart rate',
                                'bpm'
                            )}

                            {vitalRow(
                                'bloodOxygen',
                                'Blood oxygen',
                                '%',
                                100
                            )}

                            {vitalRow(
                                'temperature',
                                'Temperature',
                                '°C'
                            )}

                            <div className="mt-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm text-white">
                                        Blood pressure
                                    </h3>

                                    <span className="text-sm text-[#B9C9DD]">
                                        mmHg
                                    </span>
                                </div>

                                <div className="mt-1 grid grid-cols-2 gap-3">
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="systolic"
                                            className="mb-1 block text-xs text-[#B9C9DD]"
                                        >
                                            Systolic
                                        </label>

                                        <input
                                            id="systolic"
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="Enter value"
                                            value={vitals.systolic}
                                            onChange={(event) =>
                                                updateVital(
                                                    'systolic',
                                                    event.target.value
                                                )
                                            }
                                            className={inputStyle}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="diastolic"
                                            className="mb-1 block text-xs text-[#B9C9DD]"
                                        >
                                            Diastolic
                                        </label>

                                        <input
                                            id="diastolic"
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="Enter value"
                                            value={vitals.diastolic}
                                            onChange={(event) =>
                                                updateVital(
                                                    'diastolic',
                                                    event.target.value
                                                )
                                            }
                                            className={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="min-w-0">
                            <section className={cardStyle}>
                                <h2 className="text-xl font-bold">
                                    Measurement details
                                </h2>

                                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-3">
                                    <label
                                        htmlFor="recordedAt"
                                        className="text-sm"
                                    >
                                        Recorded at
                                    </label>

                                    <input
                                        id="recordedAt"
                                        type="datetime-local"
                                        value={recordedAt}
                                        onChange={(event) => {
                                            setRecordedAt(event.target.value)
                                            setReadingsSaved(false)
                                        }}
                                        className={`${inputStyle} [color-scheme:dark]`}
                                    />
                                </div>

                                <p className="mt-2 text-sm">
                                    Context
                                </p>

                                <div className="mt-1 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMeasurementContext('resting')
                                            setReadingsSaved(false)
                                        }}
                                        aria-pressed={
                                            measurementContext === 'resting'
                                        }
                                        className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                                            measurementContext === 'resting'
                                                ? 'bg-[#F0B429] text-[#102B4C]'
                                                : 'bg-[#0C294A] text-[#B9C9DD]'
                                        }`}
                                    >
                                        {measurementContext === 'resting'
                                            ? '✓ '
                                            : ''}
                                        Resting
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMeasurementContext(
                                                'after_activity'
                                            )
                                            setReadingsSaved(false)
                                        }}
                                        aria-pressed={
                                            measurementContext ===
                                            'after_activity'
                                        }
                                        className={`rounded-full px-4 py-1.5 text-sm ${
                                            measurementContext ===
                                            'after_activity'
                                                ? 'bg-[#F0B429] font-semibold text-[#102B4C]'
                                                : 'bg-[#0C294A] text-[#B9C9DD]'
                                        }`}
                                    >
                                        {measurementContext ===
                                        'after_activity'
                                            ? '✓ '
                                            : ''}
                                        After activity
                                    </button>
                                </div>

                                <p className="mt-2 text-xs italic text-[#B9C9DD]">
                                    Leave unavailable readings blank.
                                </p>
                            </section>

                            <button
                                type="button"
                                onClick={() => setReadingsSaved(true)}
                                disabled={
                                    !areVitalsValid ||
                                    !hasVitalReading
                                }
                                className="mt-3 w-full rounded-full bg-linear-to-b from-[#FFE47B] to-[#F0B429] px-4 py-3 text-lg font-bold text-[#102B4C] shadow-[0_3px_0_#A77A17] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save readings
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="mt-3 w-full py-1 text-center text-sm text-[#B9C9DD]"
                            >
                                Cancel
                            </button>

                            
                            {readingsSaved && (
                                <button
                                    type="button"
                                    onClick={submitCheckIn}
                                    disabled={
                                        isSubmitting ||
                                        checkInResult !== null
                                    }
                                    className="mt-3 w-full rounded-full bg-[#F0B429] px-4 py-3 font-bold text-[#102B4C] hover:bg-[#FFD166] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? 'Submitting Check-In...'
                                        : 'Submit Daily Check-In'}
                                </button>
                            )}

                            {submissionError && (
                                <p
                                    role="alert"
                                    className="mt-3 text-center text-sm text-[#FF6472]"
                                >
                                    {submissionError}
                                </p>
                            )}


								{submissionError && (
    							<p
        							role="alert"
        							className="mt-3 text-center text-sm text-[#FF6472]"
    							>
        							{submissionError}
    							</p>
							)}

                            {readingsSaved && (
                                <p
                                    role="status"
                                    className="mt-2 text-center text-xs text-[#B9C9DD]"
                                >
                                    Readings retained in this session only.
                                    Not submitted to the backend.
                                </p>
                            )}

                            <p className="mt-3 text-center text-xs italic text-[#B9C9DD]">
                                Decision support prototype. Not a medical device.
                            </p>
                        </div>
                    </div>
                </>
            )}

            
            {/* STEP 3 — BACKEND CHECK-IN CONFIRMATION */}
            {currentStep === 3 && checkInResult && (
                <section className="mx-auto w-full max-w-4xl text-white">
                    <div className="rounded-2xl bg-linear-to-b from-[#24538B] to-[#173A6B] p-6 shadow-lg">
                        <h1 className="text-2xl font-bold">
                            Daily Check-In Submitted
                        </h1>

                        <p className="mt-3 text-sm text-[#C4D4E6]">
                            {astronautId.charAt(0).toUpperCase() +
                                astronautId.slice(1)}
                            {' · '}Mission Day {checkInResult.day}
                        </p>

                        <p
                            role="status"
                            className="mt-5 font-semibold text-[#4CC38A]"
                        >
                            HALO's backend confirmed your wellness
                            check-in was saved.
                        </p>

                        <div className="mt-5 rounded-xl bg-[#102B4C] p-4">
                            <p className="text-sm text-[#C4D4E6]">
                                Check-In Reference
                            </p>

                            <p className="mt-1 break-all font-semibold">
                                {checkInResult.checkin_id}
                            </p>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-xl font-bold">
                                Detected Health Concerns
                            </h2>

                            {checkInResult.new_flags.length === 0 ? (
                                <p className="mt-3 text-sm text-[#C4D4E6]">
                                    No additional health flags were
                                    returned for this check-in.
                                    This does not establish an
                                    overall GREEN assessment.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {checkInResult.new_flags.map((flag) => (
                                        <div
                                            key={flag.id}
                                            className={`rounded-xl border-l-4 bg-[#102B4C] p-4 ${
                                                flag.severity === 'RED'
                                                    ? 'border-[#FF6472]'
                                                    : flag.severity === 'YELLOW'
                                                        ? 'border-[#F0B429]'
                                                        : 'border-[#4CC38A]'
                                            }`}
                                        >
                                            <p className="font-bold">
                                                {flag.system.toUpperCase()}
                                                {' · '}
                                                {flag.severity}
                                            </p>

                                            <p className="mt-2 text-sm leading-relaxed text-[#C4D4E6]">
                                                {flag.explanation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <p className="mt-5 text-xs italic text-[#C4D4E6]">
                            Health flags are generated by HALO's
                            backend detection engine. Entered vital
                            readings are not included in this
                            submission.
                        </p>

                        <button
                            type="button"
                            onClick={finishCheckIn}
                            className="mt-6 w-full rounded-xl bg-[#F0B429] px-6 py-3 font-bold text-[#102B4C] hover:bg-[#FFD166]"
                        >
                            Done
                        </button>
                    </div>

                    <p className="mt-5 text-center text-xs italic text-[#C4D4E6]">
                        HALO is a decision-support research prototype,
                        not a certified medical device.
                    </p>
                </section>
            )}
        </main>
    )
}

export default DailyCheckIn
