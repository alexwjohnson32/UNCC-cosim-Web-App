import { Box, ChevronDown, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import Page from "../Page";
import { useState } from "react";
import { v4 as uuid } from "uuid";

export default function ComponentsPage() {
    const [expandedComponent, setExpandedComponent] = useState("");

    function createComponentCard(id) {
        return (
            <>
                <div
                    id={id}
                    className={`flex w-full p-3 justify-between items-center border border-black/10 rounded-t-lg ${expandedComponent !== id && "rounded-b-lg"} cursor-pointer`}
                    onClick={() => setExpandedComponent(expandedComponent === id ? "" : id)}
                >
                    <div className="flex gap-2 items-center">
                        {expandedComponent === id ? <ChevronDown stroke="#6a7282" /> : <ChevronRight stroke="#6a7282" />}
                        <div className="flex flex-col">
                            <div className="flex gap-2 items-center">
                                <span>Rural Transmission Cluster</span>
                                <span className="border border-black/20 px-2 py-[2px] text-[10px] rounded-sm">2025-05-10</span>
                                {id === 'nested' && <span className="border bg-black/10 border-black/20 px-2 py-[2px] text-[10px] rounded-sm">Nested</span>}
                            </div>
                            <span className="text-gray-500 text-xs">IEEE 14-bus with IEEE 37-bus distribution</span>
                            <span className="text-gray-500 text-xs">Root: IEEE 14-Bus - Dist: 1 - Sub: 0</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center justify-center border border-black/10 hover:bg-black/5 rounded-lg w-10 h-10 cursor-pointer">
                            <Copy height={18} stroke="#6a7282" />
                        </button>
                        <button className="flex items-center justify-center border border-black/10 hover:bg-black/5 rounded-lg w-10 h-10 cursor-pointer">
                            <Trash2 height={18} stroke="#6a7282" />
                        </button>
                    </div>
                </div>
                {expandedComponent === id &&
                    <div className="flex flex-col p-3 gap-2 border border-x-black/10 border-b-black/10 border-t-transparent rounded-b-lg">
                        <div className="flex flex-col">
                            <span className="text-sm">Root Node (Transmission)</span>
                            <div className="flex p-2 rounded-lg justify-between bg-corvid-primary/5 border border-black/10 items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs">IEEE 30-Bus</span>
                                    <span className="text-xs text-gray-500">30 buses, 6 generators</span>
                                </div>
                                <span className="bg-corvid-primary/5 border border-corvid-primary/25 px-2 py-1 text-[10px] rounded-sm">GridPack</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm">Distribution Nodes (7)</span>
                            <div className="grid grid-cols-3 gap-2">
                                {createDistSection()}
                                {createDistSection()}
                                {createDistSection()}
                                {createDistSection()}
                                {createDistSection()}
                                {createDistSection()}
                                {createDistSection()}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm">Sub Components (1)</span>
                            <div className="grid grid-cols-3 gap-2">
                                {createComponentSection()}
                            </div>
                        </div>
                    </div>
                }
            </>
        );
    }

    function createDistSection() {
        return (
            <div className="flex p-2 rounded-lg justify-between bg-[#12AE1F]/5 border border-black/10 items-center">
                <div className="flex flex-col">
                    <span className="text-xs">IEEE 123-Bus Distribution</span>
                    <span className="text-xs text-gray-500">123 nodes, 85 loads</span>
                </div>
                <span className="bg-[#12AE1F]/5 border border-[#12AE1F]/25 px-2 py-1 text-[10px] rounded-sm">GridLab-D</span>
            </div>

        )
    }

    function createComponentSection() {
        return (
            <div className="flex p-2 rounded-lg justify-between bg-[#D93229]/5 border border-black/10 items-center">
                <div className="flex flex-col">
                    <span className="text-xs">IEEE 123-Bus Distribution</span>
                    <span className="text-xs text-gray-500">123 nodes, 85 loads</span>
                </div>
                <span className="bg-[#D93229]/5 border border-[#D93229]/25 px-2 py-1 text-[10px] rounded-sm">GridLab-D</span>
            </div>

        )
    }

    return (
        <Page metadata={"Component Builder"}>
            {/* METADATA */}
            <div className="flex flex-col border border-black/10 rounded-md p-4">
                <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col">
                        <div className="flex gap-1 items-center">
                            <Box height={18} className="stroke-gray-500" />
                            <span>Component Library</span>
                        </div>
                        <span className="text-sm text-gray-500">Create reusable grid components with transmission root nodes and distribution branches</span>
                    </div>
                    <button className="flex bg-corvid-primary text-white stroke-white gap-2 px-4 py-2 rounded-sm h-min font-bold">
                        <Plus strokeWidth={3} />
                        New Component
                    </button>
                </div>
                <div className="flex">
                    <div className="flex flex-col flex-1 gap-1 py-4 justify-center items-center">
                        <span className="font-bold text-3xl text-blue-600">2</span>
                        <span className="text-xs text-gray-500">Total Components</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-1 py-4 justify-center items-center">
                        <span className="font-bold text-3xl text-green-600">3</span>
                        <span className="text-xs text-gray-500">Distribution Nodes</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-1 py-4 justify-center items-center">
                        <span className="font-bold text-3xl text-orange-600">0</span>
                        <span className="text-xs text-gray-500">Nested Components</span>
                    </div>
                </div>
            </div>

            {/* COMPONENT LIST */}
            <div className="flex flex-col border border-black/10 rounded-md gap-4 p-4 flex-1 min-h-0">
                <div className="flex flex-col shrink-0">
                    <div className="flex gap-1">
                        <span>Component Library</span>
                        <span>(2)</span>
                    </div>
                    <span className="text-sm text-gray-500">
                        Click on a component to expand and view details
                    </span>
                </div>

                {/* Scrollable area */}
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
                    {Array.from({ length: 2 }, (_, i) => i + 1).map(num =>
                        createComponentCard(`component${num}`)
                    )}
                    {createComponentCard('nested')}
                </div>
            </div>
        </Page>
    )
}