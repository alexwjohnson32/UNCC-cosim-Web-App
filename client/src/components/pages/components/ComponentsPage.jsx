import { Box, ChevronDown, ChevronRight, Copy, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import Page from "../Page";
import { fetchJSON } from "../../../utils/RESTUtils";

export default function ComponentsPage() {
    const [components, setComponents] = useState({});
    const [expandedComponent, setExpandedComponent] = useState("");

    useEffect(() => {
        loadComponents();
    }, []);

    async function loadComponents() {
        try {
            const { components } = await fetchJSON("/api/components");
            setComponents(components);
        } catch (err) {
            console.error("Error loading components:", err);
        }
    }

    function createComponentCard(component) {
        const { name, date, rootNode, distNodes, subComponents } = component;

        return (
            <div key={uuid()}>
                <div
                    id={name}
                    className={`flex w-full p-3 justify-between items-center border border-black/10 rounded-t-lg ${expandedComponent !== name && "rounded-b-lg"} cursor-pointer`}
                    onClick={() => setExpandedComponent(expandedComponent === name ? "" : name)}
                >
                    <div className="flex gap-2 items-center">
                        {expandedComponent === name ? <ChevronDown stroke="#6a7282" /> : <ChevronRight stroke="#6a7282" />}
                        <div className="flex flex-col">
                            <div className="flex gap-2 items-center">
                                <span>{name}</span>
                                <span className="border border-black/20 px-2 py-[2px] text-[10px] rounded-sm">{date}</span>
                                {subComponents.length > 0 && <span className="border bg-black/10 border-black/20 px-2 py-[2px] text-[10px] rounded-sm">Nested</span>}
                            </div>
                            <span className="text-gray-500 text-xs">{rootNode.model} transmission system  with {distNodes.length > 1 ? `${distNodes.length} distribution feeders` : `a ${distNodes[0].model} Distribution system`}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center justify-center border border-black/10 hover:bg-black/5 rounded-lg w-10 h-10 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Copy height={18} stroke="#6a7282" />
                        </button>
                        <button className="flex items-center justify-center border border-black/10 hover:bg-black/5 rounded-lg w-10 h-10 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Edit height={18} stroke="#6a7282" />
                        </button>
                        <button className="flex items-center justify-center border border-black/10 hover:bg-black/5 rounded-lg w-10 h-10 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Trash2 height={18} stroke="#6a7282" />
                        </button>
                    </div>
                </div>
                {expandedComponent === name &&
                    <div className="flex flex-col p-3 gap-2 border border-x-black/10 border-b-black/10 border-t-transparent rounded-b-lg">
                        <div className="flex flex-col">
                            <span className="text-sm">Root Node (Transmission)</span>
                            <div className="flex p-2 rounded-lg justify-between bg-corvid-primary/5 border border-black/10 items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs">{rootNode.model}</span>
                                </div>
                                <span className="bg-corvid-primary/5 border border-corvid-primary/25 px-2 py-1 text-[10px] rounded-sm">{rootNode.system}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm">Distribution Nodes ({distNodes.length})</span>
                            <div className="grid grid-cols-4 gap-2">
                                {distNodes.map((node) => createDistSection(node))}
                            </div>
                        </div>

                        {subComponents.length > 0 &&
                            <div className="flex flex-col">
                                <span className="text-sm">Sub Components ({subComponents})</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {subComponents.map(sub => createComponentSection(components[sub]))}
                                </div>
                            </div>
                        }
                    </div>
                }
            </div>
        );
    }

    function createDistSection(node) {
        return (
            <div key={uuid()} className="flex p-2 rounded-lg justify-between bg-[#12AE1F]/5 border border-black/10 items-center">
                <div className="flex flex-col">
                    <span className="text-xs">{node.model}</span>
                    <span className="text-xs text-gray-500">Bus ID: {node.bus_id}</span>
                </div>
                <span className="bg-[#12AE1F]/5 border border-[#12AE1F]/25 px-2 py-1 text-[10px] rounded-sm">{node.system}</span>
            </div>

        )
    }

    function createComponentSection(sub) {
        return (
            <div key={uuid()} className="flex p-2 rounded-lg justify-between bg-[#D93229]/5 border border-black/10 items-center">
                <div className="flex flex-col">
                    <span className="text-xs">{sub.name}</span>
                    <span className="text-xs text-gray-500">{sub.rootNode.model} transmission system  with {sub.distNodes.length > 1 ? `${sub.distNodes.length} distribution feeders` : `a ${sub.distNodes[0].model} Distribution system`}</span>
                </div>
                <span className="bg-[#D93229]/5 border border-[#D93229]/25 px-2 py-1 text-[10px] rounded-sm">Component</span>
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
                    <button className="flex items-center bg-corvid-primary active:brightness-95 text-white text-sm stroke-white px-2 py-1 rounded-sm h-min font-bold cursor-pointer">
                        <Plus strokeWidth={3} height={18} />
                        New Component
                    </button>
                </div>
                <div className="flex">
                    <div className="flex flex-col flex-1 gap-1 py-4 justify-center items-center">
                        <span className="font-bold text-3xl text-blue-600">{Object.keys(components).length}</span>
                        <span className="text-xs text-gray-500">Total Components</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-1 py-4 justify-center items-center">
                        <span className="font-bold text-3xl text-green-600">{Object.values(components).reduce((sum, comp) => sum + comp.distNodes.length, 0)}</span>
                        <span className="text-xs text-gray-500">Distribution Nodes</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-1 py-4 justify-center items-center">
                        <span className="font-bold text-3xl text-orange-600">{Object.values(components).reduce((sum, comp) => sum + comp.subComponents.length, 0)}</span>
                        <span className="text-xs text-gray-500">Nested Components</span>
                    </div>
                </div>
            </div>

            {/* COMPONENT LIST */}
            <div className="flex flex-col border border-black/10 rounded-md gap-4 p-4 flex-1 min-h-0">
                <div className="flex flex-col shrink-0">
                    <div className="flex gap-1">
                        <span>Component Library</span>
                        <span>({Object.keys(components).length})</span>
                    </div>
                    <span className="text-sm text-gray-500">
                        Click on a component to expand and view details
                    </span>
                </div>

                {/* Scrollable area */}
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
                    {Object.values(components).map(comp => createComponentCard(comp))}
                </div>
            </div>
        </Page>
    )
}
