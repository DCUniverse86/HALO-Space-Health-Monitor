    import type { BodySystem, Severity } from "../types/api";

    export interface StatusTileProps {
        system: BodySystem
        severity: Severity
        message: string
    }

    function StatusTile({system, severity, message}: StatusTileProps) {
        const displayName = system.charAt(0).toUpperCase() + system.slice(1)
        const severityColor = severity === 'GREEN' 
            ? 'text-[#4CC38A]'
            : severity === 'YELLOW'
                ? 'text-[#F0B429]'
                : 'text-[#F03333]'
        const borderColor = severity === 'GREEN'
            ? 'border-[#4CC38A]'
            : severity === 'YELLOW'
                ? 'border-[#F0B429]'
                : 'border-[#F03333]'
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