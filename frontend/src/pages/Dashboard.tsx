import StatusTile from "../components/StatusTile"
import type { BodySystem, Severity } from "../types/api"

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
function Dashboard() {
    return (
        <main>
            <h1>Mission Health Dashboard</h1>
            
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
        </main>
    )
}
export default Dashboard