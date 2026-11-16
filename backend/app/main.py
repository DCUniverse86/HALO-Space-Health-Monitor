
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.storage import AlreadyExistsError
from app.detection.engine import (
    AstronautNotFoundError,
    DayNotFoundError,
    DayOutOfRangeError,
    UnknownMetricError,
)
from app.routers import astronauts
from app.routers.astronauts import FlagNotFoundError


# Handle invalid API requests.
async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    problems = "; ".join(
        f"{'.'.join(str(part) for part in err['loc'][1:]) or err['loc'][0]}: {err['msg']}"
        for err in exc.errors()
    )

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": problems,
            }
        },
    )


# Create standardized HALO API errors.
def _error_handler(status_code: int, code: str):
    async def handle(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                    "code": code,
                    "message": (
                        str(exc.args[0])
                        if exc.args
                        else "An error occurred."
                    ),
                }
            },
        )

    return handle


# Initialize the HALO FastAPI application.
app = FastAPI(
    title="HALO API",
    description="Health Assessment and Longitudinal Observer",
    version="1.0.0",
)


# Register API exception handlers.
app.add_exception_handler(
    AstronautNotFoundError,
    _error_handler(404, "ASTRONAUT_NOT_FOUND"),
)

app.add_exception_handler(
    DayNotFoundError,
    _error_handler(404, "DAY_NOT_FOUND"),
)

app.add_exception_handler(
    DayOutOfRangeError,
    _error_handler(400, "INVALID_REQUEST"),
)

app.add_exception_handler(
    UnknownMetricError,
    _error_handler(400, "INVALID_REQUEST"),
)

app.add_exception_handler(
    FlagNotFoundError,
    _error_handler(404, "FLAG_NOT_FOUND"),
)

app.add_exception_handler(
    AlreadyExistsError,
    _error_handler(409, "ALREADY_EXISTS"),
)

app.add_exception_handler(
    RequestValidationError,
    validation_error_handler,
)


# Configure CORS for local development and Vercel.
FRONTEND_URL = os.getenv(
    "HALO_FRONTEND_URL",
    "",
).rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "OPTIONS",
    ],
    allow_headers=[
        "Content-Type",
    ],
)


# Register astronaut monitoring and assistant endpoints.
app.include_router(astronauts.router)


# Root endpoint.
@app.get("/")
async def root():
    return {
        "message": "HALO API",
        "version": "1.0.0",
        "status": "running",
    }


# Health check endpoint.
@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }
