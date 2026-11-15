    import type { TrendsResponse } from "../types/api";
    // Components used to display responsive health trend graphs
    import {
        ResponsiveContainer,
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ReferenceLine,
        Legend,
    } from 'recharts'

    // Defines the data received by the Trends graph
    interface TrendsChartProps {
        data: TrendsResponse | null
    }

    // Displays historical astronaut health measurements.
    function TrendsChart({data}: TrendsChartProps){
        return (
            <section className="w-full rounded-2xl bg-linear-to-br from-[#1F4A85] to-[#173A6B] p-5 text-white shadow-lg">
                <h2 className="text-xl font-semibold">Health Trends</h2>
                {data === null || data.points.length === 0 ? (
                    <p className="mt-4 text-sm text-[#A8BDD6]" role="status">
                        No trend data available.
                    </p>
                ) : (
                    <div className="mt-4 w-full">
                        {/* Identify the health metric and its measurement units. */}
                        <p className="mb-3 text-sm text-[#A8BDD6]">
                            {data.metric} ({data.unit})
                        </p>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.points}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="day" />
                                    <YAxis
                                        domain={[
                                            (dataMin: number) =>
                                                Math.floor(Math.min(dataMin, data.baseline.lower) - 3),
                                            (dataMax: number) =>
                                                Math.ceil(Math.max(dataMax, data.baseline.upper) + 3),
                                        ]}
                                        tick={{ fill: '#FFFFFF', fontSize: 12 }}
                                        axisLine={{ stroke: '#A8BDD6' }}
                                        tickLine={{ stroke: '#A8BDD6' }}
                                        width={45}
                                    />
                                    <Tooltip />
                                    {/* Identify the measurement and trend lines. */}
                                    <Legend />
                                    {/* Display the astronaut's personal baseline and reference boundaries */}
                                    <ReferenceLine
                                        y={data.baseline.median}
                                        stroke="#FFFFFF"
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                        label={{
                                            value: `Baseline: ${data.baseline.median} ${data.unit}`,
                                            position: 'insideTopRight',
                                            fill: '#FFFFFF',
                                            fontSize: 12,
                                        }}
                                    />
                                    <ReferenceLine
                                        y={data.baseline.lower}
                                        stroke="#A8BDD6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        label={{
                                            value: `Lower: ${data.baseline.lower} ${data.unit}`,
                                            position: 'insideBottomRight',
                                            fill: '#A8BDD6',
                                            fontSize: 11,
                                        }}
                                    />
                                    <ReferenceLine
                                        y={data.baseline.upper}
                                        stroke="#A8BDD6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        label={{
                                            value: `Upper: ${data.baseline.upper} ${data.unit}`,
                                            position: 'insideTopRight',
                                            fill: '#A8BDD6',
                                                fontSize: 11,
                                        }}
                                    />
                                    <Line
                                        type="monotone"                                    
                                        dataKey="value"
                                        name="Measurements"
                                        stroke="#4CC38A"
                                        strokeWidth={2}
                                        connectNulls={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ewma"
                                        name="EWMA Trend"
                                        stroke="#FFD166"
                                        strokeWidth={4}
                                        dot={{
                                            r: 4,
                                            fill: '#FFD166',
                                            stroke: '#102B4C',
                                            strokeWidth: 2,
                                        }}
                                        activeDot={{ r: 7 }}
                                        connectNulls={false}
                                        />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </section>
        )
    }

    export default TrendsChart