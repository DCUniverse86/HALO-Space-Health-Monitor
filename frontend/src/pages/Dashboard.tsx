import StatusTile from "../components/StatusTile"
import type { BodySystem, Severity } from "../types/api"
import { useState } from "react"

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
// Displays the astronaut's health status across five monitored systems.
function Dashboard() {
    // Track temporary loading and error states for UI testing.
    const [isLoading] = useState(false)
    const [error] = useState<string | null>(null)
    
    // Display loading, error, or health information.   
    return (
        <main>
            <h1>Mission Health Dashboard</h1>
            {isLoading ? (
            <p>Loading astronaut health data...</p>
        )
        : error ? (
            <p role="alert">{error}</p>
        ) : (
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
        )}
        </main>
    )
}
export default Dashboard