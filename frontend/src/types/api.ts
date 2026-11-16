// Shared frontend data types
 

// Defines the three possible health severity levels.
export type Severity = 'GREEN' | 'YELLOW' | 'RED'

// Identifies HALO's five monitored health systems.
export type BodySystem = 
    | 'cardiovascular'
    | 'immune'
    | 'musculoskeletal'
    | 'behavioral'
    | 'environment'

    // Stores the severity and explanation for one health system.
export interface SystemStatus {
    severity: Severity
    message: string
}

// Stores a health measurement and its baseline comparison.
export interface MetricStatus {
    value: number | null
    unit: string
    z_score: number | null
    severity: Severity
}

// Describes a health concern detected by the backend.
export interface HealthFlag {
    id: string
    system: BodySystem
    severity: Severity
    code: string
    explanation: string
}

// Contains an astronaut's health status for a selected mission day.
export interface AstronautStatus {
    astronaut_id: string
    astronaut_name: string
    day: number
    overall_severity: Severity
    systems: Record<BodySystem, SystemStatus>
    metrics: Record<string, MetricStatus>
    flags: HealthFlag[]
}

// Stores basic astronaut profile information.
export interface Astronaut {
    id: string
    name: string
    mission: string
}

// Contains the astronaut profiles returned by the backend.
export interface AstronautListResponse {
    astronauts: Astronaut[]
}

// Defines the baseline statistics for one health metric.
export interface BaselineMetric {
    median: number
    scale: number
    unit: string
}

// Contains an astronaut's personal health baselines.
export interface BaselineResponse {
    astronaut_id: string
    metrics: Record<string, BaselineMetric>
}

// Represents one measurement in a health trend.
export interface TrendPoint {
    day: number
    value: number | null
    ewma: number | null
    severity: Severity
}

// Contains historical measurements and baseline boundaries.
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

// Defines the information submitted during a daily check-in.
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

// Contains confirmation and any new flags from a check-in.
export interface CheckInResponse {
    success: boolean
    checkin_id: string
    day: number
    new_flags: HealthFlag[]
}

// Defines a message sent to HALO's AI assistant.   
export interface AssistantRequest {
    day: number
    flag_id: string | null
    message: string
}

// Identifies a source supporting an assistant response.
export interface AssistantSource {
    title: string
    source_id: string
    passage: string
}

// Contains the assistant's guidance, sources, and disclaimer.
export interface AssistantResponse {
    mode: 'ai' | 'offline_rules'
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


// Defines a request to escalate a health concern.
export interface EscalationRequest {
    day: number
    flag_id: string
    reason: string
}

// Contains the escalation report and communication status.
export interface EscalationResponse {
    success: boolean
    report_id: string
    severity: Severity
    recipient: string
    mission_control_status: string
    message: string
}

// Contains the backend health-check response.
export interface HealthResponse {
    status: string
}

// Defines the standard API error response.
export interface ApiErrorResponse {
    error: {
        code: string
        message: string
    }
}
