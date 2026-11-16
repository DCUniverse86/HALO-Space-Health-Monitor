import type  { Severity } from '../types/api'

// Defines information displayed in Dashboard Header 
interface DashboardHeaderProps {
    astronautName: string
    missionDay: number
    overallSeverity: Severity | null
    isDemo: boolean    
}

// Displays astronaut information and overall mission status.
function DashboardHeader({
    astronautName,
    missionDay,
    overallSeverity,
    isDemo,
} : DashboardHeaderProps) {
    // Select the text color for the overall health status    
    const severityColor = overallSeverity === 'GREEN' 
        ? 'text-[#4CC38A]'
        : overallSeverity === 'YELLOW'
            ? 'text-[#F0B429]'
            :overallSeverity === 'RED'
                ? 'text-[#F03333]'
                : 'text-gray-400'

        return (
            <header className='w-full text-white'>
                {/* HALO branding and AI availability indicator */}
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <img
                        src="/halo_wordmark_white.png"
                        alt="HALO"
                        className='h-auto w-28 object-contain'
                    />
                </div>

                {/* Astronauts information for the selected mission day*/}
                <div className='mt-4'>
                    <h2 className='text-lg font-semibold'>{astronautName}</h2>
                    <p className='text-sm italic text-[#A8BDD6]'>
                        Mission Day: {missionDay}
                    </p>
                </div>
                    {/* Display the HALO robot beside the health assessment */}
                    <div className='mt-6 flex items-center gap-4 sm:gap-6'>
                        <img
                            src="/robot_face.png"
                            alt="HALO robot"
                            className='h-40 w-40 shrink-0 object-contain sm:h-52 sm:w-52 lg:h-64 lg:w-64'
                        />
                    
                    {/* Display health status and AI assessment beside HALO */}
                    <div className="min-w-0 flex-1 space-y-3">
                        <span className={`text-2xl font-bold sm:text-3xl ${severityColor}`}>
                            {overallSeverity ?? "Unavailable"}
                        </span>

                        <p className='mt-2 text-sm text-[#A8BDD6]'>
                            Health Assessment and Recommendations are not available yet.
                        </p>
                    </div>
                </div>

                {isDemo && (
                    <p className='mt-3 text-xs text-[#A8BDD6]'>
                        Demonstration Data
                    </p>
                )}
            </header>
        )
    }
export default DashboardHeader
