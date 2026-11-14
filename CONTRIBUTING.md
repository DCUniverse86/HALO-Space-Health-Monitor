# Contributing to HALO

HALO - Health Assessment Longitudinal Observer

## Team Responsibilities

- Donald Carpenter Jr. (DCUniverse86): Frontend, integration, and deployment
- Donte Littlejohn (litdonte): FastAPI backend and Gemini integration
- Roman Dumych (romandumac): Health monitoring, simulation, detection, and testing
- Viktoriia Lavrenchuk (VictoriaGraceL): Figma design, research, and content

## Branches

- `main` - Shared, stable application
- `feat/frontend` - Frontend and integration
- `feat/ai-assistant - Backend and AI
- `feat/health-monitoring - Simulation and detection
- `feat/design-assets - Design assets and research

## Development Workflow

1. Pull the latest `main` changes into your feature branch.
2. Make changes within your assigned responsibilities.
3. Test your changes locally.
4. Commit with a descriptive message.
5. Push to your feature branch.
6. Open a pull request targeting `main`.
7. Review changes and resolve conflicts.
8. Merge only after verification.

Keep pull requests small whenever possible

## API Contract

- Follow HALO API Contract v1.0.
- Do not rename or remove existing API fields without approval from Donald, Donte, Roman, and Viktoriia.
- Proposed additional API fields require team agreement before implementation.

## Design

- Viktoriia owns HALO's Figma designs and visual assets.
- Frontend implementation must follow approved designs. Coordinate changes with Viktoriia.

## Security

- Never commit API keys, passwords, or secrets.
- Never commit real `.env` files.
- Use `.env.example` for safe configuration examples.
- Keep Gemini credentials on the backend only.
- Use simulated health data for the demonstration.

## Testing

Before opening a pull request:

- Run relevant build and lint checks.
- Test the affected functionality.
- Verify API request and response compatibility.
- Check for errors and regressions.

## Communication

- Report blockers promptly.
- Coordinate changes to shared files before editing.
- Keep `main` stable and ready for demonstrations.