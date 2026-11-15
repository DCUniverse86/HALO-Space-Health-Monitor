import { useState } from "react"
import type { CheckInRequest, Severity } from "../types/api"
import AssessmentResults from "../components/AssessmentResults"

const symptomOptions = ["Fatigue", "Headache", "Back Pain", "Fever", "None"]
const sleepOptions = [
  "Under 5 Hours", "5 to under 6 Hours", "6 to under 7 Hours",
  "7 to 8 Hours", "Over 8 Hours",
]
const moodOptions = Array.from({ length: 10 }, (_, index) => index + 1)

type VitalKey = "restingHeartRate" | "bloodOxygen" | "temperature" | "systolic" | "diastolic"
type Vitals = Record<VitalKey, string>
const initialVitals: Vitals = {
  restingHeartRate: "", bloodOxygen: "", temperature: "", systolic: "", diastolic: "",
}
const inputStyle = "h-9 min-w-0 w-full rounded-lg border border-[#31577D] bg-[#0C294A] px-3 text-sm text-white outline-none placeholder:text-[#91A8C2] focus:border-[#F0B429]"
const cardStyle = "rounded-[20px] border border-[#31577D]/40 bg-linear-to-b from-[#214E85] to-[#173C70] p-4 shadow-lg"

function DailyCheckIn() {
  const [formData, setFormData] = useState<Partial<CheckInRequest>>({})
  const [selectedSleep, setSelectedSleep] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [demoSeverity, setDemoSeverity] = useState<Severity>('GREEN')
  const [measurementContext, setMeasurementContext] = useState<"resting" | "after_activity">("resting")
  const [recordedAt, setRecordedAt] = useState("")
  const [vitals, setVitals] = useState<Vitals>(initialVitals)
  const [readingsSaved, setReadingsSaved] = useState(false)

  const updateMood = (mood: number) => setFormData(previous => ({ ...previous, mood }))

  const toggleSymptom = (symptom: string) => {
    setFormData(previous => {
      const current = previous.symptoms ?? []
      if (symptom === "None") {
        return { ...previous, symptoms: current.includes("None") ? [] : ["None"] }
      }
      const other = current.filter(item => item !== "None")
      return {
        ...previous,
        symptoms: other.includes(symptom)
          ? other.filter(item => item !== symptom)
          : [...other, symptom],
      }
    })
  }

  const updateVital = (field: VitalKey, value: string) => {
    setVitals(previous => ({ ...previous, [field]: value }))
    setReadingsSaved(false)
  }

  const isValidOptionalPositive = (value: string) =>
    value.trim() === "" || (Number.isFinite(Number(value)) && Number(value) > 0)

  const hasVitalReading = Object.values(vitals).some(value => value.trim() !== "")
  const areVitalsValid =
    isValidOptionalPositive(vitals.restingHeartRate) &&
    isValidOptionalPositive(vitals.temperature) &&
    isValidOptionalPositive(vitals.systolic) &&
    isValidOptionalPositive(vitals.diastolic) &&
    (vitals.bloodOxygen.trim() === "" ||
      (Number(vitals.bloodOxygen) > 0 && Number(vitals.bloodOxygen) <= 100)) &&
    (vitals.systolic === "" || vitals.diastolic === "" ||
      Number(vitals.systolic) > Number(vitals.diastolic))

  const isStepOneComplete =
    selectedSleep !== null && formData.mood != null && (formData.symptoms?.length ?? 0) > 0


  // Reset this local demo after finishing the preview.
  const finishCheckIn = () => {
    setCurrentStep(1)
    setFormData({})
    setSelectedSleep(null)
    setVitals({ ...initialVitals })
    setMeasurementContext("resting")
    setRecordedAt("")
    setReadingsSaved(false)
    setDemoSeverity("GREEN")
  }

  // Input rows follow the uploaded HALO Application (8).png design.
  const vitalRow = (field: VitalKey, label: string, unit: string, max?: number) => (
    <div className="mt-3" key={field}>
      <label htmlFor={field} className="mb-1 block text-sm text-white">{label}</label>
      <div className="flex items-center gap-3">
        <input
          id={field}
          type="number"
          min="0"
          max={max}
          step="any"
          placeholder="Enter value"
          value={vitals[field]}
          onChange={event => updateVital(field, event.target.value)}
          className={inputStyle}
        />
        <span className="w-8 shrink-0 text-sm text-[#B9C9DD]">{unit}</span>
      </div>
    </div>
  )

  return (
    <main className={currentStep === 2 ? "mx-auto w-full max-w-6xl px-4 pb-28 pt-4 text-white sm:px-6 lg:px-8" : "mx-auto w-full max-w-3xl px-5 pb-24 pt-6 text-white"}>
      {currentStep === 1 && (
        <>
          <h1 className="text-2xl font-bold">Daily Check-In</h1>
          <p className="mt-1 text-[#B9C9DD]">Record your daily health information</p>
          <p className="mt-4 text-sm text-[#B9C9DD]">Step 1 of 3</p>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">How Many Hours Did You Sleep?</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {sleepOptions.map(option => (
                <button key={option} type="button"
                  onClick={() => setSelectedSleep(option)}
                  aria-pressed={selectedSleep === option}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${selectedSleep === option
                    ? "border-[#F0B429] bg-[#F0B429] text-[#102B4C]"
                    : "border-[#A8BDD6] bg-[#1F4A85] text-white"}`}>
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">How Would You Rate Your Mood?</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {moodOptions.map(rating => (
                <button key={rating} type="button"
                  onClick={() => updateMood(rating)}
                  aria-pressed={formData.mood === rating}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border font-medium ${formData.mood === rating
                    ? "border-[#F0B429] bg-[#F0B429] text-[#102B4C]"
                    : "border-[#1F4A85] bg-[#1F4A85] text-white"}`}>
                  {rating}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Are You Experiencing Any Symptoms?</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {symptomOptions.map(symptom => (
                <button key={symptom} type="button"
                  onClick={() => toggleSymptom(symptom)}
                  aria-pressed={formData.symptoms?.includes(symptom) ?? false}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${formData.symptoms?.includes(symptom)
                    ? "border-[#F0B429] bg-[#F0B429] text-[#102B4C]"
                    : "border-[#1F4A85] bg-[#1F4A85] text-white"}`}>
                  {symptom}
                </button>
              ))}
            </div>
          </section>

          <button type="button" disabled={!isStepOneComplete}
            onClick={() => setCurrentStep(2)}
            className="mt-8 w-full rounded-xl bg-[#F0B429] px-6 py-4 font-bold text-[#102B4C] disabled:cursor-not-allowed disabled:opacity-50">
            Next
          </button>
        </>
      )}

      {currentStep === 2 && (
        <>
          <header className="relative pr-14">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentStep(1)}
                aria-label="Back to daily check-in"
                className="flex h-8 w-7 items-center justify-center text-2xl text-white">
                ←
              </button>
              <h1 className="text-[25px] font-bold leading-tight">Enter Vitals</h1>
            </div>
            {/* Small CSS robot badge; can be swapped for the existing HALO robot asset. */}
            <div aria-hidden="true" className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#8DA9C9] bg-[#DCE7F4] shadow-md">
              <div className="relative flex h-8 w-9 items-center justify-center rounded-[14px] border-2 border-[#071D3A] bg-[#143C71]">
                <span className="absolute left-[7px] top-[10px] h-[5px] w-[5px] rounded-full bg-[#F0B429]" />
                <span className="absolute right-[7px] top-[10px] h-[5px] w-[5px] rounded-full bg-[#F0B429]" />
                <span className="absolute bottom-[5px] h-[4px] w-[12px] rounded-b-full border-b-2 border-[#F0B429]" />
              </div>
            </div>
            <p className="mt-3 text-sm italic text-[#B9C9DD]">Commander Alex · Mission day 75</p>
            <p className="mt-1 text-sm text-[#B9C9DD]">Enter readings from your measuring device.</p>
            <span className="mt-2 inline-block rounded-full border border-[#7895B7] px-2 py-0.5 text-[10px] tracking-[0.12em] text-[#B9C9DD]">DEMO ENTRY</span>
          </header>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section className={cardStyle}>
            <h2 className="text-xl font-bold">Your measurements</h2>
            {vitalRow("restingHeartRate", "Resting heart rate", "bpm")}
            {vitalRow("bloodOxygen", "Blood oxygen", "%", 100)}
            {vitalRow("temperature", "Temperature", "°C")}
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-white">Blood pressure</h3>
                <span className="text-sm text-[#B9C9DD]">mmHg</span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label htmlFor="systolic" className="mb-1 block text-xs text-[#B9C9DD]">Systolic</label>
                  <input id="systolic" type="number" min="0" step="1" placeholder="Enter value"
                    value={vitals.systolic} onChange={event => updateVital("systolic", event.target.value)}
                    className={inputStyle} />
                </div>
                <div className="min-w-0">
                  <label htmlFor="diastolic" className="mb-1 block text-xs text-[#B9C9DD]">Diastolic</label>
                  <input id="diastolic" type="number" min="0" step="1" placeholder="Enter value"
                    value={vitals.diastolic} onChange={event => updateVital("diastolic", event.target.value)}
                    className={inputStyle} />
                </div>
              </div>
            </div>
          </section>

          <div className="min-w-0">
          <section className={cardStyle}>
            <h2 className="text-xl font-bold">Measurement details</h2>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-3">
              <label htmlFor="recordedAt" className="text-sm">Recorded at</label>
              <input id="recordedAt" type="datetime-local" value={recordedAt}
                onChange={event => { setRecordedAt(event.target.value); setReadingsSaved(false) }}
                className={`${inputStyle} [color-scheme:dark]`} />
            </div>
            <p className="mt-2 text-sm">Context</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button"
                onClick={() => { setMeasurementContext("resting"); setReadingsSaved(false) }}
                aria-pressed={measurementContext === "resting"}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${measurementContext === "resting"
                  ? "bg-[#F0B429] text-[#102B4C]" : "bg-[#0C294A] text-[#B9C9DD]"}`}>
                {measurementContext === "resting" ? "✓ " : ""}Resting
              </button>
              <button type="button"
                onClick={() => { setMeasurementContext("after_activity"); setReadingsSaved(false) }}
                aria-pressed={measurementContext === "after_activity"}
                className={`rounded-full px-4 py-1.5 text-sm ${measurementContext === "after_activity"
                  ? "bg-[#F0B429] font-semibold text-[#102B4C]" : "bg-[#0C294A] text-[#B9C9DD]"}`}>
                {measurementContext === "after_activity" ? "✓ " : ""}After activity
              </button>
            </div>
            <p className="mt-2 text-xs italic text-[#B9C9DD]">Leave unavailable readings blank.</p>
          </section>

          <button type="button" onClick={() => setReadingsSaved(true)}
            disabled={!areVitalsValid || !hasVitalReading}
            className="mt-3 w-full rounded-full bg-linear-to-b from-[#FFE47B] to-[#F0B429] px-4 py-3 text-lg font-bold text-[#102B4C] shadow-[0_3px_0_#A77A17] disabled:cursor-not-allowed disabled:opacity-50">
            Save readings
          </button>
          <button type="button" onClick={() => setCurrentStep(1)}
            className="mt-3 w-full py-1 text-center text-sm text-[#B9C9DD]">
            Cancel
          </button>
          {readingsSaved && (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="mt-3 w-full rounded-full bg-[#F0B429] px-4 py-3 font-bold text-[#102B4C] hover:bg-[#FFD166]"
            >
              Continue to demo assessment
            </button>
          )}
          {readingsSaved && (
            <p role="status" className="mt-2 text-center text-xs text-[#B9C9DD]">
              Readings retained in this session only. Not submitted to the backend.
            </p>
          )}
          <p className="mt-3 text-center text-xs italic text-[#B9C9DD]">
            Decision support prototype. Not a medical device.
          </p>
          </div>
          </div>
        </>
      )}
      {/* Display the Step 3 assessment preview. */}
{currentStep === 3 && (
    <div className="mx-auto w-full max-w-4xl">
        {/* Switch between fictional assessment scenarios. */}
        <div className="mb-6 rounded-2xl bg-[#173A6B] p-4">
            <p className="mb-3 text-sm font-semibold text-white">
                Demo Assessment Preview
            </p>

            <div className="flex flex-wrap gap-3">
                {(['GREEN', 'YELLOW', 'RED'] as const).map(
                    (severity) => (
                        <button
                            key={severity}
                            type="button"
                            onClick={() => setDemoSeverity(severity)}
                            aria-pressed={demoSeverity === severity}
                            className={`rounded-xl border px-5 py-3 font-semibold ${
                                demoSeverity === severity
                                    ? 'border-[#F0B429] bg-[#F0B429] text-[#102B4C]'
                                    : 'border-[#A8BDD6] bg-[#1F4A85] text-white'
                            }`}
                        >
                            {severity}
                        </button>
                    )
                )}
            </div>
        </div>

        <AssessmentResults
            severity={demoSeverity}
            onDone={finishCheckIn}
        />
    </div>
)}
    </main>
  )
}

export default DailyCheckIn
