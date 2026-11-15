import type { BodySystem, Severity } from "../types/api";

// Defines the information each health-system card receives.
export interface StatusTileProps {
    system: BodySystem
    severity: Severity
    message: string
}

// Displays the status of one monitored health system.
function StatusTile({system, severity, message}: StatusTileProps) {
    // Capitalize the system name for display.
    const displayName = system.charAt(0).toUpperCase() + system.slice(1)
    // Apply text colors.
    const severityColor = severity === 'GREEN' 
        ? 'text-[#4CC38A]'
        : severity === 'YELLOW'
            ? 'text-[#F0B429]'
            : 'text-[#F03333]'
    // Match the card's left border to its severity.
    const borderColor = severity === 'GREEN'
        ? 'border-[#4CC38A]'
        : severity === 'YELLOW'
            ? 'border-[#F0B429]'
            : 'border-[#F03333]'
    // Display the system name, severity, and explanation.
    return (
        <div className={`w-full rounded-2xl border-l-4 bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 shadow-lg 
    ${borderColor}`}>
            <div className="flex items-center justify-between gap-3">
                <h3>{displayName}</h3>
                <span className={severityColor}>{severity}</span>
            </div>
            <p>{message}</p>
        </div>
    )
}

export default StatusTile