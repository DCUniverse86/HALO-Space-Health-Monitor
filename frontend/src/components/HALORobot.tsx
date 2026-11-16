
import type { Severity } from '../types/api'

// Available HALO robot poses.
export type RobotPose =
    | 'standing'
    | 'waving'
    | 'thinking'
    | 'pointing'
    | 'alert'
    | 'thumbs_up'

// Properties for displaying the HALO robot.
interface HALORobotProps {
    pose: RobotPose
    severity?: Severity
    className?: string
}

// Map each pose to its existing image.
const robotImages: Record<RobotPose, string> = {
    standing: '/robot_standing.png',
    waving: '/robot_waving.png',
    thinking: '/robot_thinking.png',
    pointing: '/robot_pointing.png',
    alert: '/robot_alert.png',
    thumbs_up: '/robot_thumbs_up.png',
}

// Display the correct robot artwork.
function HALORobot({
    pose,
    severity,
    className = '',
}: HALORobotProps) {
    let imageSource = robotImages[pose]

    if (pose === 'alert' && severity === 'YELLOW') {
        imageSource = '/robot_alert_yellow.png'
    }

    if (pose === 'alert' && severity === 'RED') {
        imageSource = '/robot_alert_red.png'
    }

    if (pose === 'thumbs_up' && severity === 'GREEN') {
        imageSource = '/robot_thumbs_up_green.png'
    }

    return (
        <img
            src={imageSource}
            alt={`HALO robot ${pose.replace('_', ' ')}`}
            className={`h-auto max-w-full object-contain ${className}`}
        />
    )
}

export default HALORobot
