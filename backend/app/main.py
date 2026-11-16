from fastapi import Request
from fastapi import FastAPI
from app.storage import AlreadyExistsError
from fastapi.middleware.cors import CORSMiddleware
from .routers import astronauts
from fastapi.responses import JSONResponse
from app.detection.engine import (
    AstronautNotFoundError,
    DayNotFoundError,
    DayOutOfRangeError,
    UnknownMetricError,
)
from app.routers.astronauts import FlagNotFoundError
from fastapi.exceptions import RequestValidationError


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    problems = "; ".join(
        f"{'.'.join(str(part) for part in err['loc'][1:]) or err['loc'][0]}: {err['msg']}"
        for err in exc.errors()
    )
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": problems}},
    )


def _error_handler(status_code: int, code: str):
    async def handle(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content={"error": {"code": code, "message": exc.args[0]}},
        )

    return handle


# HALO FastAPI application
app = FastAPI(
    title="HALO API",
    description="Health Assessment and Longitudinal Observer",
    version="1.0.0",
)

app.add_exception_handler(
    AstronautNotFoundError, _error_handler(404, "ASTRONAUT_NOT_FOUND")
)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(DayNotFoundError, _error_handler(404, "DAY_NOT_FOUND"))
app.add_exception_handler(DayOutOfRangeError, _error_handler(400, "INVALID_REQUEST"))
app.add_exception_handler(UnknownMetricError, _error_handler(400, "INVALID_REQUEST"))
app.add_exception_handler(FlagNotFoundError, _error_handler(404, "FLAG_NOT_FOUND"))
app.add_exception_handler(AlreadyExistsError, _error_handler(409, "ALREADY_EXISTS"))

app.include_router(astronauts.router)

# Allow the local React frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}
