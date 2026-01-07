import { Activity, ChartColumn, Clock, Play, Zap } from "lucide-react";
import { useState } from "react";
import Page from "../Page";

export default function DashboardPage() {
    const [availableSims, setAvailableSims] = useState(["test1", "test2"]);
    const [activeSim, setActiveSim] = useState("");

    const getPlacholderPane = () => {
        return (
            <div className="flex flex-col border border-black/10 rounded-md p-4 h-full items-center justify-center">
                <Zap height={40} width={36} className="stroke-gray-500" />
                <span className="text-gray-500">Select a Simulation</span>
                <span className="text-gray-400">
                    Choose a simulation run from the dropdown above to view detailed analytics and performance metrics.
                </span>
            </div>
        )
    }

    const getMetricsPane = () => {
        return (
            <div className="grid grid-rows-8 grid-cols-4 gap-4 h-full">
                {/* Top level cards */}
                <div className="flex flex-col row-span-2 border p-8 rounded-lg border-black/10">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Simulation Status</span>
                        <Play height={18} className="stroke-gray-700" />
                    </div>
                    <div className="flex flex-col h-full w-full justify-end">
                        <span className="text-green-600 font-bold text-xl">Completed</span>
                        <span className="text-xs text-gray-500">2025-06-2025</span>
                    </div>
                </div>
                <div className="flex flex-col row-span-2 border p-8 rounded-lg border-black/10">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Peak Load</span>
                        <Activity height={18} className="stroke-gray-700" />
                    </div>
                    <div className="flex flex-col h-full w-full justify-end">
                        <span className="font-bold text-xl">347 MW</span>
                        <span className="text-xs text-gray-500">Maximum observed in timeframe</span>
                    </div>
                </div>
                <div className="flex flex-col row-span-2 border p-8 rounded-lg border-black/10">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Data Points</span>
                        <ChartColumn height={18} className="stroke-gray-700" />
                    </div>
                    <div className="flex flex-col h-full w-full justify-end">
                        <span className="font-bold text-xl">100</span>
                        <span className="text-xs text-gray-500">Time series samples</span>
                    </div>
                </div>
                <div className="flex flex-col row-span-2 border p-8 rounded-lg border-black/10">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Analysis Window</span>
                        <Clock height={18} className="stroke-gray-700" />
                    </div>
                    <div className="flex flex-col h-full w-full justify-end">
                        <span className="font-bold text-xl">3h 0m 0s</span>
                        <span className="text-xs text-gray-500">0:00 - 3:00:00</span>
                    </div>
                </div>

                {/* Graphs and Plots */}
                <div className="flex flex-col row-span-3 col-span-2 border p-8 rounded-lg border-black/10 h-full">
                    <span>Voltage Profile</span>
                    <span className="text-gray-500 text-sm mb-2">Voltage monitoring across the distribution network</span>
                    <div className="h-full w-full bg-gray-200"></div>
                </div>
                <div className="flex flex-col row-span-3 col-span-2 border p-8 rounded-lg border-black/10 h-full">
                    <span>Frequency Stability</span>
                    <span className="text-gray-500 text-sm mb-2">Grid frequency measurements in Hz</span>
                    <div className="h-full w-full bg-gray-200"></div>
                </div>
                <div className="flex flex-col row-span-3 col-span-2 border p-8 rounded-lg border-black/10 h-full">
                    <span>Load Distribution</span>
                    <span className="text-gray-500 text-sm mb-2">Power consumption by sector</span>
                    <div className="h-full w-full bg-gray-200"></div>
                </div>
                <div className="flex flex-col row-span-3 col-span-2 border p-8 rounded-lg border-black/10 h-full">
                    <span>Power Flow</span>
                    <span className="text-gray-500 text-sm mb-2">Load distribution over selected time period</span>
                    <div className="h-full w-full bg-gray-200"></div>
                </div>
            </div>
        )
    }

    return (
        <Page metadata={"Dashboard"}>
            <div className="flex gap-2 border border-black/10 rounded-md p-4 w-full">
                <div className="flex flex-col w-full">
                    <span className="text-sm">Simulation Run</span>
                    <select
                        required
                        value={activeSim}
                        className="border border-gray-500 rounded-sm w-full px-2 py-1 focus:outline-none invalid:text-gray-400 invalid:border-gray-300 invalid:italic cursor-pointer"
                        onChange={(e) => setActiveSim(e.target.value)}
                    >
                        <option value={""} disabled hidden>Select simulation run...</option>
                        {availableSims.map(sim => <option key={sim} value={sim} className="text-black">{sim}</option>)}
                    </select>
                </div>
            </div>

            {activeSim ? getMetricsPane() : getPlacholderPane()}
        </Page>
    )
}