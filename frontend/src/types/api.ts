/**
 * Shared frontend data types
 */

export type Severity = 'GREEN' | 'YELLOW' | 'RED'

export type BodySystem = 
    | 'cardiovascular'
    | 'immune'
    | 'musculoskeletal'
    | 'behavioral'
    | 'environment'

export interface SystemStatus {
    severity: Severity
    message: string
}

export interface MetricStatus {
    value: number | null
    unit: string
    z_score: number | null
    severity: Severity
}

export interface HealthFlag {
    id: string
    system: BodySystem
    severity: Severity
    code: string
    explanation: string
}

export interface AstronautStatus {
    astronaut_id: string
    astronaut_name: string
    day: number
    overall_severity: Severity
    systems: Record<BodySystem, SystemStatus>
    metrics: Record<string, MetricStatus>
    flags: HealthFlag[]
}

export interface Astronaut {
    id: string
    name: string
    mission: string
}

export interface AstronautListResponse {
    astronauts: Astronaut[]
}

export interface BaselineMetric {
    median: number
    scale: number
    unit: string
}
export interface BaselineResponse {
    astronaut_id: string
    metrics: Record<string, BaselineMetric>
}

export interface TrendPoint {
    day: number
    value: number | null
    ewma: number | null
    severity: Severity
}

export interface TrendsResponse {
    astronaut_id: string
    metric: string
    unit: string
    baseline: {
        median: number
        lower: number
        upper: number
    }
    points: TrendPoint[]
}

export interface CheckInRequest {
    day: number
    sleep_quality: number
    mood: number
    stress: number
    fatigue: number
    pain: {
        level: number
        location: string | null
    }
    symptoms: string[]
    notes: string
}

export interface CheckInResponse {
    success: boolean
    checkin_id: string
    day: number
    new_flags: HealthFlag[]
}

export interface AssistantRequest {
    day: number
    flag_id: string | null
    message: string
}

export interface AssistantSource {
    title: string
    source_id: string
    passage: string
}

export interface AssistantResponse {
    summary: string
    severity: Severity
    likely_causes: string[]
    questions: string[]
    actions: string[]
    escalate: boolean
    recheck_in_hours: number | null
    sources: AssistantSource[]
    disclaimer: string
}

export interface EscalationRequest {
    day: number
    flag_id: string
    reason: string
}

export interface EscalationResponse {
    success: boolean
    report_id: string
    severity: Severity
    recipient: string
    mission_control_status: string
    message: string
}

export interface HealthResponse {
    status: string
}

export interface ApiErrorResponse {
    error: {
        code: string
        message: string
    }
}