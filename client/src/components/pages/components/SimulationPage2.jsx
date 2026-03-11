import { Folder, Network, Settings, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Page from "../Page";

const createBlankSimulation = () => ({
    id: crypto.randomUUID(),
    name: "",
    deployDirectory: "",
    startDate: "",
    startTime: "",
    durationMinutes: 0,
    durationSeconds: 0,
    rootNode: "",
    busIds: "",
    distributionNodesPerBusId: 0,
    distributionMode: "Even Distribution",
});

const initialSimulations = [
    {
        id: crypto.randomUUID(),
        name: "10-1 Node Simulation",
        deployDirectory: "/simulations/10-1-node",
        startDate: "2026-03-11",
        startTime: "09:00",
        durationMinutes: 2,
        durationSeconds: 0,
        rootNode: "IEEE-118",
        busIds: "101, 102, 103",
        distributionNodesPerBusId: 2,
        distributionMode: "Even Distribution",
    },
    {
        id: crypto.randomUUID(),
        name: "Grid Stress Test A",
        deployDirectory: "/simulations/grid-stress-a",
        startDate: "2026-03-12",
        startTime: "13:30",
        durationMinutes: 4,
        durationSeconds: 30,
        rootNode: "IEEE-300",
        busIds: "12, 17, 21, 25",
        distributionNodesPerBusId: 3,
        distributionMode: "Random Distribution",
    },
];

export default function SimulationPage2() {
    const [simulations, setSimulations] = useState(initialSimulations);
    const [selectedSimId, setSelectedSimId] = useState("");
    const [activeSimId, setActiveSimId] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [offset, setOffset] = useState("");
    const [draftSimulation, setDraftSimulation] = useState(createBlankSimulation());

    useEffect(() => {
        const offsetMinutes = new Date().getTimezoneOffset();
        const offsetHours = Math.abs(offsetMinutes / 60);
        const sign = offsetMinutes > 0 ? "-" : "+";

        const isDST = new Date()
            .toLocaleString("en-US", { timeZoneName: "short" })
            .includes("CDT");

        const label = isDST ? "CDT" : "CST";
        setOffset(`UTC ${sign}${offsetHours} (${label})`);
    }, []);

    const activeSimulation = useMemo(
        () => simulations.find((sim) => sim.id === activeSimId) ?? null,
        [simulations, activeSimId]
    );

    const getSimulations = () =>
        simulations.map((sim) => (
            <option key={sim.id} className="text-black" value={sim.id}>
                {sim.name || "Untitled Simulation"}
            </option>
        ));

    const sectionHeader = (label) => (
        <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 whitespace-nowrap">
                {label}
            </span>
            <div className="h-px flex-1 bg-black/10" />
        </div>
    );

    const labelClass = "text-[11px] font-medium text-gray-600";
    const inputClass =
        "h-8 w-full rounded-sm border border-black/20 bg-white px-2.5 text-sm text-black placeholder:italic placeholder:text-gray-400 focus:border-black/50 focus:outline-none";
    const selectClass =
        "h-8 w-full rounded-sm border border-black/20 bg-white px-2.5 text-sm text-black focus:border-black/50 focus:outline-none";
    const buttonSecondaryClass =
        "h-8 rounded-sm border border-black/20 bg-white px-3 text-sm font-medium text-gray-700 transition active:brightness-95 cursor-pointer";
    const buttonPrimaryClass =
        "h-8 rounded-sm bg-corvid-primary px-3 text-sm font-semibold text-white transition active:brightness-95 cursor-pointer";

    function updateDraft(field, value) {
        setDraftSimulation((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handleNew() {
        const blank = createBlankSimulation();
        setSelectedSimId("");
        setActiveSimId("");
        setDraftSimulation(blank);
        setIsEditing(true);
    }

    function handleEdit() {
        const sim = simulations.find((item) => item.id === selectedSimId);
        if (!sim) return;

        setActiveSimId(sim.id);
        setDraftSimulation({ ...sim });
        setIsEditing(true);
    }

    function handleCancel() {
        if (activeSimId) {
            const original = simulations.find((sim) => sim.id === activeSimId);
            if (original) {
                setDraftSimulation({ ...original });
            }
        } else {
            setDraftSimulation(createBlankSimulation());
        }

        setIsEditing(false);
    }

    function handleSave() {
        const trimmedName = draftSimulation.name.trim();

        const simulationToSave = {
            ...draftSimulation,
            name: trimmedName,
        };

        if (!trimmedName) {
            return;
        }

        setSimulations((prev) => {
            const exists = prev.some((sim) => sim.id === simulationToSave.id);

            if (exists) {
                return prev.map((sim) =>
                    sim.id === simulationToSave.id ? simulationToSave : sim
                );
            }

            return [...prev, simulationToSave];
        });

        setSelectedSimId(simulationToSave.id);
        setActiveSimId(simulationToSave.id);
        setDraftSimulation(simulationToSave);
        setIsEditing(false);
    }

    function getSimulationConfiguration() {
        return (
            <div className="flex flex-col gap-5 w-full">
                <div className="flex items-center gap-2">
                    <Network height={16} className="stroke-gray-500" />
                    <span className="text-lg font-semibold text-gray-900">
                        {draftSimulation.name || activeSimulation?.name || "New Simulation"}
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-6 gap-y-4">
                    <div className="xl:col-span-3 flex flex-col gap-1">
                        <span className={labelClass}>Name</span>
                        <input
                            type="text"
                            placeholder="10-1 Node Simulation..."
                            value={draftSimulation.name}
                            onChange={(e) => updateDraft("name", e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="xl:col-span-4 flex flex-col gap-1">
                        <span className={labelClass}>Deploy Directory</span>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Choose directory..."
                                value={draftSimulation.deployDirectory}
                                onChange={(e) =>
                                    updateDraft("deployDirectory", e.target.value)
                                }
                                className="h-8 w-full rounded-sm border border-black/20 bg-white pl-2.5 pr-9 text-sm text-black placeholder:italic placeholder:text-gray-400 focus:border-black/50 focus:outline-none"
                            />
                            <Folder
                                size={15}
                                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                            />
                        </div>
                    </div>
                </div>

                {sectionHeader("Schedule")}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-6 gap-y-4 items-end">
                    <div className="xl:col-span-2 flex flex-col gap-1">
                        <span className={labelClass}>Start Date</span>
                        <input
                            type="date"
                            value={draftSimulation.startDate}
                            onChange={(e) => updateDraft("startDate", e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="xl:col-span-3 flex flex-col gap-1">
                        <span className={labelClass}>Start Time</span>
                        <div className="flex items-end gap-2">
                            <input
                                type="time"
                                value={draftSimulation.startTime}
                                onChange={(e) => updateDraft("startTime", e.target.value)}
                                className={inputClass}
                            />
                            <span className="mb-0.5 whitespace-nowrap text-[11px] text-gray-500">
                                {offset}
                            </span>
                        </div>
                    </div>

                    <div className="xl:col-span-1 flex items-center h-8">
                        <span className="text-sm font-medium text-gray-700">
                            Duration
                        </span>
                    </div>

                    <div className="xl:col-span-2 flex flex-col gap-1">
                        <span className={labelClass}>Minutes</span>
                        <input
                            type="number"
                            value={draftSimulation.durationMinutes}
                            onChange={(e) =>
                                updateDraft("durationMinutes", Number(e.target.value))
                            }
                            className={inputClass}
                        />
                    </div>

                    <div className="xl:col-span-2 flex flex-col gap-1">
                        <span className={labelClass}>Seconds</span>
                        <input
                            type="number"
                            value={draftSimulation.durationSeconds}
                            onChange={(e) =>
                                updateDraft("durationSeconds", Number(e.target.value))
                            }
                            className={inputClass}
                        />
                    </div>
                </div>

                {sectionHeader("Nodes")}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-6 gap-y-4 items-end">
                    <div className="xl:col-span-3 flex flex-col gap-1">
                        <span className={labelClass}>Root Node</span>
                        <select
                            value={draftSimulation.rootNode}
                            onChange={(e) => updateDraft("rootNode", e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Select transmission model...</option>
                            <option value="IEEE-118">IEEE-118</option>
                            <option value="IEEE-300">IEEE-300</option>
                            <option value="IEEE-8500">IEEE-8500</option>
                        </select>
                    </div>

                    <div className="xl:col-span-3 flex flex-col gap-1">
                        <span className={labelClass}>Bus IDs</span>
                        <input
                            type="text"
                            value={draftSimulation.busIds}
                            onChange={(e) => updateDraft("busIds", e.target.value)}
                            placeholder="101, 102, 103"
                            className={inputClass}
                        />
                    </div>

                    <div className="xl:col-span-3 flex flex-col gap-1">
                        <span className={labelClass}>Distribution Nodes (per bus ID)</span>
                        <input
                            type="number"
                            value={draftSimulation.distributionNodesPerBusId}
                            onChange={(e) =>
                                updateDraft(
                                    "distributionNodesPerBusId",
                                    Number(e.target.value)
                                )
                            }
                            className={inputClass}
                        />
                    </div>

                    <div className="xl:col-span-3 flex flex-col gap-1">
                        <span className={labelClass}>Distribution Mode</span>
                        <select
                            value={draftSimulation.distributionMode}
                            onChange={(e) =>
                                updateDraft("distributionMode", e.target.value)
                            }
                            className={selectClass}
                        >
                            <option value="Even Distribution">Even Distribution</option>
                            <option value="Random Distribution">Random Distribution</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-black/10 pt-4">
                    <button className={buttonSecondaryClass} onClick={handleCancel}>
                        Cancel
                    </button>

                    <button className={buttonPrimaryClass} onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Page metadata={"Simulation"}>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
                <div className="rounded-md border border-black/10 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <Settings size={16} className="stroke-gray-500" />
                                <span className="text-base font-semibold text-gray-900">
                                    Configuration
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">
                                Configure a simulation using different nodes and components
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                required
                                value={selectedSimId}
                                className="h-9 min-w-64 rounded-sm border border-black/20 bg-white px-3 text-sm text-black focus:outline-none"
                                onChange={(e) => setSelectedSimId(e.target.value)}
                            >
                                <option value="" disabled hidden>
                                    Choose simulation...
                                </option>
                                {getSimulations()}
                            </select>

                            <button
                                disabled={!selectedSimId}
                                onClick={handleEdit}
                                className="h-9 rounded-sm border border-corvid-primary bg-white px-4 text-sm font-semibold text-corvid-primary disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            >
                                Edit
                            </button>

                            <button
                                className="h-9 rounded-sm bg-corvid-primary px-4 text-sm font-semibold text-white cursor-pointer"
                                onClick={handleNew}
                            >
                                New
                            </button>
                        </div>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="flex min-h-105 flex-col items-center justify-center rounded-md border border-black/10 bg-white p-8 text-center">
                        <Zap size={34} className="stroke-gray-500" />
                        <span className="mt-2 text-sm font-medium text-gray-600">
                            Select a Simulation or Create New
                        </span>
                        <span className="text-sm text-gray-400">
                            Choose a simulation above to edit its configuration
                        </span>
                    </div>
                ) : (
                    <div className="rounded-md border border-black/10 bg-white px-4 py-5">
                        {getSimulationConfiguration()}
                    </div>
                )}
            </div>
        </Page>
    );
}