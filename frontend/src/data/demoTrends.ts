import type { TrendsResponse } from "../types/api";

// Simulated resting heart rate data for HALO frontend testing.
export const demoTrends: TrendsResponse = {
    astronaut_id: 'demo-astronaut',
    metric: 'Resting Heart Rate',
    unit: 'bpm',    

    // Simulated personal baseline boundaries
    baseline: {
        median: 62,
        lower: 55,
        upper: 70,
    },

    // Simulated measurements across seven mission days
    points: [
        { day: 69, value: 62, ewma: 62, severity: 'GREEN' },
        { day: 70, value: 64, ewma: 63, severity: 'GREEN' },
        { day: 71, value: 63, ewma: 63, severity: 'GREEN' },
        { day: 72, value: 66, ewma: 64, severity: 'GREEN' },
        { day: 73, value: 68, ewma: 65, severity: 'GREEN' },
        { day: 74, value: 70, ewma: 67, severity: 'GREEN' },
        { day: 75, value: 71, ewma: 68, severity: 'YELLOW' },
    ],
}