
import TrendsChart from '../components/TrendsChart'
import { demoTrends } from '../data/demoTrends'

// Displays HALO's astronaut health trends page.
function Trends() {
    return (
        <main className="w-full text-white">
            {/* Trends page heading */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold">
                    Health Trends
                </h1>

                <p className="mt-2 text-sm text-[#A8BDD6]">
                    Monitor changes in astronaut health over time.
                </p>
            </header>

            {/* Reuse the existing Home dashboard graph. */}
            <TrendsChart data={demoTrends} />

            {/* Explain why no measurements are displayed yet. */}
            <p className="mt-4 text-center text-sm text-[#A8BDD6]">
                Simulated mission data for demonstration purposes.
                Not actual astronaut health measurements.
            </p>
        </main>
    )
}

export default Trends
