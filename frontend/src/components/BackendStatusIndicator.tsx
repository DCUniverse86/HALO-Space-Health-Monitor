
interface BackendStatusIndicatorProps {
    status: 'checking' | 'connected' | 'disconnected'
}

// Displays the FastAPI backend connection status.
function BackendStatusIndicator({
    status,
}: BackendStatusIndicatorProps) {
    const statusConfig = {
        checking: {
            label: 'Backend: Checking...',
            color: 'bg-gray-400',
        },
        connected: {
            label: 'Backend: Connected',
            color: 'bg-[#4CC38A]',
        },
        disconnected: {
            label: 'Backend: Offline',
            color: 'bg-[#FF6472]',
        },
    }

    const current = statusConfig[status]

    return (
        <div
            className="flex items-center gap-2 text-xs text-[#C4D4E6]"
            role="status"
        >
            <span
                className={`h-2.5 w-2.5 rounded-full ${current.color}`}
                aria-hidden="true"
            />

            <span>{current.label}</span>
        </div>
    )
}

export default BackendStatusIndicator
