import StatusTile from "../components/StatusTile"
import type { BodySystem, Severity } from "../types/api"
import { useState } from "react"
import DashboardHeader from "../components/DashboardHeader"
import TrendsChart from "../components/TrendsChart"

// Temporary health-system data for testing the Dashboard layout.
const healthSystems:{
    system: BodySystem
    severity: Severity
    message: string
    }[] = [
    {
        system: 'cardiovascular',
        severity: 'GREEN',
        message: 'No significant deviation detected.',
    },
    {
        system: 'immune',
        severity: 'GREEN',
        message: 'No significant deviation detected.',
    },
    {
        system: 'musculoskeletal',
        severity: 'GREEN',
        message: 'No significant deviation detected.',
    },
    {
        system: 'behavioral',
        severity: 'GREEN',
        message: 'No significant deviation detected.',
    },
    {
        system: 'environment',
        severity: 'GREEN',
        message: 'No significant deviation detected.',
    }
]

// Allows the Home Screen to open the Daily Check-in page.
interface DashboardProps {
    onStartCheckIn: () => void
}
// Displays the astronaut's health status across five monitored systems.
function Dashboard({onStartCheckIn}: DashboardProps) {
    // Track temporary loading and error states for UI testing.
    const [isLoading] = useState(false)
    const [error] = useState<string | null>(null)
    
    // Display loading, error, or health information.   
    return (
        <main className="w-full">
            <DashboardHeader
                astronautName="Alex"
                missionDay={75}
                overallSeverity={null}
                isDemo={true}
                aiStatus='unknown'
            />
            {isLoading ? (
            <p>Loading astronaut health data...</p>
        )
        : error ? (
            <p role="alert">{error}</p>
        ) : (
            <>
                <div className="mt-6 grid grid-cols-1 gap-4">
                    {healthSystems.map((health) => (
                    <StatusTile
                        key = {health.system}
                        system = {health.system}
                        severity = {health.severity}
                        message= {health.message}
                        />
                    ))}
                </div> 
                
                {/* Displays health trends on the Home screen */}
                <div className="mt-6 w-full">
                    <TrendsChart data={null} />
                </div>

                {/* Start the astronaut's daily check-in */}
                <button
                    type='button'
                    onClick={onStartCheckIn}
                    className="mt-6 w-full rounded-xl bg-[#F0B429] px-6 py-4 font-bold text-[#102B4C] transition-colors
                hover:bg-[#FFD166]" 
                >
                    Start Daily Check-In
                </button> 
                {/* Display HALO's medical safety disclaimer */}
                <p className="mt-6 px-3 text-center text-sm leading-relaxed text-[#A8BDD6]">
                    HALO is a decision-support research prototype, not a certified medical device.
                    Its simulated data, health alerts, and AI-generated information do not
                    replace medical professionals, emergency procedures, or established
                    mission medical protocols.
                </p>
             </>
        )}
        </main>
    )
}
export default Dashboard