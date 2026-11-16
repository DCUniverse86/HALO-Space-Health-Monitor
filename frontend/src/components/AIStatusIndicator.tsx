
type AIStatus = 'online' | 'offline' | 'unknown'

interface AIStatusIndicatorProps {
    status: AIStatus
}

// Displays the last verified AI assistant mode.
function AIStatusIndicator({
    status,
}: AIStatusIndicatorProps) {
    const statusConfig = {
        online: {
            label: 'AI Online',
            color: 'bg-[#4CC38A]',
        },
        offline: {
            label: 'Offline Rules Mode',
            color: 'bg-[#F0B429]',
        },
        unknown: {
            label: 'AI Status Not Yet Checked',
            color: 'bg-gray-400',
        },
    }

    const currentStatus = statusConfig[status]

    return (
        <div
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white"
            role="status"
        >
            <span
                className={`h-2.5 w-2.5 rounded-full ${currentStatus.color}`}
                aria-hidden="true"
            />

            <span>{currentStatus.label}</span>
        </div>
    )
}

export default AIStatusIndicator
