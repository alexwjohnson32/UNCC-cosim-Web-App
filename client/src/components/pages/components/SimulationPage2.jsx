import { Network, Settings, Zap } from "lucide-react";
import { useState } from "react";
import Page from "../Page";

export default function SimulationPage2() {
    const [selectedSim, setSelectedSim] = useState("");
    const [activeSim, setActiveSim] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Temporary
    const simulations = ["Sim 1", "Sim 2"];

    const getSimulations = () =>
        simulations.map(sim => (
            <option key={sim} className="text-black" value={sim}>
                {sim}
            </option>
        ));

    function getSimulationConfiguration() {
        return (
            <div className="flex justify-between items-center w-full">
                <div className="flex flex-col gap-4">
                    <div className="flex gap-1 items-center">
                        <Network height={18} className="stroke-gray-500" />
                        <span>{activeSim ? activeSim : "New Simulation"}</span>
                    </div>

                    {/* Name and deploy directory */}
                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col g-0.5">
                            <span className="text-sm">Name:</span>
                            <input
                                type="text"
                                className="border border-gray-400 focus:border-black focus:outline-none rounded-sm pl-2 pr-4 w-75">
                            </input>
                        </div>
                        <div className="flex flex-col g-0.5">
                            <span className="text-sm">Deploy Directory:</span>
                            <input
                                type="text"
                                className="border border-gray-400 focus:border-black focus:outline-none rounded-sm pl-2 pr-4 w-75">
                            </input>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Page metadata={"Simulation"}>
            <div className="flex flex-col border border-black/10 rounded-md p-4">
                <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col">
                        <div className="flex gap-1 items-center">
                            <Settings height={18} className="stroke-gray-500" />
                            <span>Configuration</span>
                        </div>
                        <span className="text-sm text-gray-500">Configure a simulation using different nodes and components</span>
                    </div>
                    <div className="flex flex-row gap-2">
                        <select
                            required
                            value={selectedSim}
                            className="border border-gray-500 rounded-sm w-66 px-2 py-1 focus:outline-none invalid:text-gray-400 invalid:italic cursor-pointer"
                            onChange={(e) => {
                                setSelectedSim(e.target.value);
                            }}
                        >
                            <option value="" disabled hidden>
                                Choose simulation...
                            </option>
                            {getSimulations()}
                        </select>
                        <button
                            disabled={!selectedSim}
                            onClick={() => {
                                setActiveSim(selectedSim);
                                setIsEditing(true);
                            }}
                            className="border border-corvid-primary disabled:opacity-40 disabled:cursor-not-allowed active:brightness-95 text-corvid-primary text-sm px-2 py-1 rounded-sm h-min font-bold cursor-pointer"
                        >
                            Edit
                        </button>
                        <button
                            className="bg-corvid-primary active:brightness-95 text-white text-sm px-2 py-1 rounded-sm h-min font-bold cursor-pointer"
                            onClick={() => {
                                setSelectedSim("");
                                setActiveSim("");
                                setIsEditing(true);
                            }}
                        >
                            New
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulation Area */}
            {!isEditing ? (
                <div className="flex flex-col border border-black/10 rounded-md p-4 h-full items-center justify-center">
                    <Zap height={40} width={36} className="stroke-gray-500" />
                    <span className="text-gray-500">Select a Simulation or Create New</span>
                    <span className="text-gray-400">
                        Choose a simulation from above to edit its configuration or click New to create a simulation
                    </span>
                </div>
            ) : (
                <div className="flex flex-col border border-black/10 rounded-md p-4 items-center">
                    {getSimulationConfiguration()}
                </div>
            )}
        </Page>
    )
}