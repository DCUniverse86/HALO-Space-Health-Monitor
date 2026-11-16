// HALO frontend API client.
// Handles communication between React and the FastAPI backend.

import type {
    HealthResponse,
    AstronautListResponse,
    BaselineResponse,
    AstronautStatus,
    TrendsResponse,
    CheckInRequest,
    CheckInResponse,
    AssistantRequest,
    AssistantResponse,
    EscalationRequest,
    EscalationResponse,
} from '../types/api'


// Use the configured backend URL or the local FastAPI server
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    'http://127.0.0.1:8000'
).replace(/\/+$/, '')

// Store HTTP status codes and backend error messages
export class ApiError extends Error {
    status: number
    code: string

    constructor(
        status: number,
        code: string,
        message: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Send requests and handle API or network errors.
async function request<T>(
    path: string,
    options: RequestInit = {},
    ): Promise<T> {
        let response: Response

        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            })
        } catch {
        // Report connection failures without claiming success
        throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Unable to connect to the HALO backend.',
        )
    }

    // Handle unsuccessful HTTP responses from the backend.
    if (!response.ok) {
        let code = 'API_ERROR'
        let message = `Request failed (${response.status}).`

        try {
            const data = await response.json()
            if (data?.error) {
            code = data.error.code ?? code
            message = data.error.message ?? message
            }
        } catch {
        // Keep the default message if the response is invalid
        }

        throw new ApiError(response.status, code, message)
    }

    // Return the successful response using the expected TypeScript type.
    return (await response.json()) as T
}

// Build a safe URL path for the  selected astronaut
const astronautPath = (id: string) => `/astronauts/${encodeURIComponent(id)}`

// API endpoints
export const haloApi = {

    aiStatus: () =>
        request<{
            status: 'online' | 'offline'
            mode: 'ai' | 'offline_rules'
        }>('/ai/status'),

    // Check FastAPI availability
    health: () => request<HealthResponse>('/health'),

    // Retrieve available astronauts
    astronauts: () => request<AstronautListResponse>('/astronauts'),
    // Retrieve the selected astronaut's personal health baselines.
    baseline: (id: string) => request<BaselineResponse>(
         `${astronautPath(id)}/baseline`,
    ),

    // Retrieve health status for the selected mission day
    status: (id: string, day: number) => request<AstronautStatus>(
        `${astronautPath(id)}/status?day=${day}`,
    ),

    // Retrieve historical measurements and trends
    trends: (
        id: string,
        metric: string,
        startDay: number,
        endDay: number,
    ) => {
        const params = new URLSearchParams({
        metric,
        start_day: String(startDay),
            end_day: String(endDay),
    })

        return request<TrendsResponse>(
        `${astronautPath(id)}/trends?${params}`,
        )
    },

    // Submit a daily health check-in
    checkin: (id: string, data: CheckInRequest) =>
        request<CheckInResponse>(
        `${astronautPath(id)}/checkin`, {
        method: 'POST',
        body: JSON.stringify(data),
    },
    ),

    // Send a message to HALO's backend AI assistant
    assistant: (id: string, data: AssistantRequest) => request<AssistantResponse>(
        `${astronautPath(id)}/assistant`, {
            method: 'POST',
            body: JSON.stringify(data),
        },
    ),

    // Request a medical escalation report
    escalate: (id: string, data: EscalationRequest) => request<EscalationResponse>(
        `${astronautPath(id)}/escalate`, {
            method: 'POST',
            body: JSON.stringify(data),
        },
    ),
}
