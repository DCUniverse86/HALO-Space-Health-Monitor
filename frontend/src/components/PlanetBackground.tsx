

import { useMemo } from 'react'

// Existing HALO planet artwork.
const planetImages = [
    '/earth.png',
    '/mars.png',
    '/venus.png',
    '/jupiter.png',
    '/neptune.png',
    '/moon.png',
    '/ice_planet.png',
    '/planet.png',
]

// Position planets across a decorative background.
interface PlanetBackgroundProps {
    layoutKey: string
}

interface PlanetPosition {
    image: string
    top: number
    left: number
    size: number
    opacity: number
}

// Create a reproducible random number from a string.
function hashString(value: string) {
    let hash = 2166136261

    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }

    return hash >>> 0
}

// Generate a repeatable random sequence for each page.
function createRandom(seed: number) {
    let state = seed

    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        return state / 4294967296
    }
}

function PlanetBackground({ layoutKey }: PlanetBackgroundProps) {
    const planets = useMemo<PlanetPosition[]>(() => {
        const random = createRandom(hashString(layoutKey))

        // Spread planets vertically across the page.
        return planetImages.map((image, index) => {
            const sectionHeight = 100 / planetImages.length

            return {
                image,
                top: index * sectionHeight + random() * sectionHeight,
                left: random() * 85,
                size: 65 + random() * 100,
                opacity: 0.25 + random() * 0.3,
            }
        })
    }, [layoutKey])

    return (
        <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            aria-hidden="true"
        >
            {planets.map((planet) => (
                <img
                    key={planet.image}
                    src={planet.image}
                    alt=""
                    loading="lazy"
                    className="absolute h-auto max-w-none object-contain"
                    style={{
                        top: `${planet.top}%`,
                        left: `${planet.left}%`,
                        width: `clamp(48px, 12vw, ${planet.size}px)`,
                        opacity: planet.opacity,
                        transform: 'translate(-50%, -50%)',
                        filter: 'drop-shadow(0 0 18px rgba(80, 140, 220, 0.2))',
                    }}
                />
            ))}
        </div>
    )
}

export default PlanetBackground
