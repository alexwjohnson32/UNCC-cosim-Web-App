import { Activity, ChartColumn, Clock, Play, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import Page from "../Page";

export default function DashboardPage() {
    const availableSims = useMemo(() => ["test1", "test2"], []);
    const [activeSim, setActiveSim] = useState("");

    const cardClass = "rounded-md border border-black/10 bg-white";
    const metricCardClass = "rounded-md border border-black/10 bg-white px-3 py-3";
    const panelClass = "rounded-md border border-black/10 bg-white px-3 py-3";
    const sectionLabelClass =
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500";
    const chartTitleClass = "text-sm font-semibold text-gray-900";
    const chartSubtitleClass = "text-xs text-gray-500";

    function getPlaceholderPane() {
        return (
            <div className="flex min-h-130 flex-col items-center justify-center rounded-md border border-black/10 bg-white p-8 text-center">
                <Zap height={34} width={34} className="stroke-gray-500" />
                <span className="mt-2 text-sm font-medium text-gray-600">
                    Select a Simulation
                </span>
                <span className="max-w-xl text-sm text-gray-400">
                    Choose a simulation run from the dropdown above to view detailed
                    analytics and performance metrics.
                </span>
            </div>
        );
    }

    function createMetricCard(title, value, subtitle, Icon, valueClassName = "text-gray-900") {
        return (
            <div className={metricCardClass}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">{title}</span>
                    <Icon size={16} className="stroke-gray-600" />
                </div>

                <div className="mt-4 flex flex-col">
                    <span className={`text-lg font-bold ${valueClassName}`}>{value}</span>
                    <span className="text-xs text-gray-500">{subtitle}</span>
                </div>
            </div>
        );
    }

    function createChartPanel(title, subtitle) {
        return (
            <div className={panelClass}>
                <div className="flex flex-col gap-0.5">
                    <span className={chartTitleClass}>{title}</span>
                    <span className={chartSubtitleClass}>{subtitle}</span>
                </div>

                <div className="mt-3 h-40 rounded-sm border border-black/5 bg-black/3" />
            </div>
        );
    }

    function getMetricsPane() {
        return (
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-3">
                    {createMetricCard(
                        "Simulation Status",
                        "Completed",
                        "2025-06-2025",
                        Play,
                        "text-green-600"
                    )}
                    {createMetricCard(
                        "Peak Load",
                        "347 MW",
                        "Maximum observed in timeframe",
                        Activity
                    )}
                    {createMetricCard(
                        "Data Points",
                        "100",
                        "Time series samples",
                        ChartColumn
                    )}
                    {createMetricCard(
                        "Analysis Window",
                        "3h 0m 0s",
                        "0:00 - 3:00:00",
                        Clock
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {createChartPanel(
                        "Voltage Profile",
                        "Voltage monitoring across the distribution network"
                    )}
                    {createChartPanel(
                        "Frequency Stability",
                        "Grid frequency measurements in Hz"
                    )}
                    {createChartPanel(
                        "Load Distribution",
                        "Power consumption by sector"
                    )}
                    {createChartPanel(
                        "Power Flow",
                        "Load distribution over selected time period"
                    )}
                </div>
            </div>
        );
    }

    return (
        <Page metadata={"Dashboard"}>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
                <div className={`px-4 py-3`}>
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-base font-semibold text-gray-900">
                                Analytics Dashboard
                            </span>
                            <span className="text-sm text-gray-500">
                                Review simulation run metrics, trends, and performance data
                            </span>
                        </div>

                        <div className="flex min-w-[320px] flex-col gap-1">
                            <span className={sectionLabelClass}>Simulation Run</span>
                            <select
                                required
                                value={activeSim}
                                className="h-9 w-full rounded-sm border border-black/20 bg-white px-3 text-sm text-black focus:outline-none invalid:border-gray-300 invalid:text-gray-400 invalid:italic cursor-pointer"
                                onChange={(e) => setActiveSim(e.target.value)}
                            >
                                <option value="" disabled hidden>
                                    Select simulation run...
                                </option>
                                {availableSims.map((sim) => (
                                    <option key={sim} value={sim} className="text-black">
                                        {sim}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {activeSim ? getMetricsPane() : getPlaceholderPane()}
            </div>
        </Page>
    );
}