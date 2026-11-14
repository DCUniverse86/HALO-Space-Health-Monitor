from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# HALO FastAPI application
app=FastAPI(
    title="HALO API",
    description="Health Assessment and Longitudinal Observer",
    version="1.0.0",
)

# Allow the local React frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}