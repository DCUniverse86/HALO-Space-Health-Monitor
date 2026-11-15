import type { BodySystem, TrendsResponse } from '../types/api'

// Simulated resting heart rate data for HALO frontend testing.
export const demoTrends: TrendsResponse = {
    astronaut_id: 'demo-astronaut',
    metric: 'Resting Heart Rate',
    unit: 'bpm',

    baseline: {
        median: 62,
        lower: 55,
        upper: 70,
    },

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

// Identifies each selectable health metric.
export interface DemoTrendMetric {
    id: string
    label: string
    system: BodySystem
    data: TrendsResponse | null
}

// Available metrics organized by HALO's five monitored systems.
export const demoTrendMetrics: DemoTrendMetric[] = [
    {
        id: 'resting_heart_rate',
        label: 'Resting Heart Rate',
        system: 'cardiovascular',
        data: demoTrends,
    },
    {
        id: 'blood_oxygen',
        label: 'Blood Oxygen',
        system: 'cardiovascular',
        data: null,
    },
    {
        id: 'blood_pressure',
        label: 'Blood Pressure',
        system: 'cardiovascular',
        data: null,
    },
    {
        id: 'temperature',
        label: 'Body Temperature',
        system: 'immune',
        data: null,
    },
    {
        id: 'pain',
        label: 'Pain Level',
        system: 'musculoskeletal',
        data: null,
    },
    {
        id: 'mobility',
        label: 'Mobility',
        system: 'musculoskeletal',
        data: null,
    },
    {
        id: 'sleep_quality',
        label: 'Sleep Quality',
        system: 'behavioral',
        data: null,
    },
    {
        id: 'mood',
        label: 'Mood',
        system: 'behavioral',
        data: null,
    },
    {
        id: 'stress',
        label: 'Stress',
        system: 'behavioral',
        data: null,
    },
    {
        id: 'fatigue',
        label: 'Fatigue',
        system: 'behavioral',
        data: null,
    },
    {
        id: 'radiation',
        label: 'Radiation Exposure',
        system: 'environment',
        data: null,
    },
]