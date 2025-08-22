import { Plug2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import Page from "../Page";

export default function ComponentsPage() {
    const [simName, setSimName] = useState("");
    const [nodes, setNodes] = useState({});
    const [nextTId, setNextTId] = useState(1);
    const [nextDId, setNextDId] = useState({});

    function createTransmissionNode() {
        const newTId = `T${nextTId}`;
        setNodes(prev => ({
            ...prev,
            [newTId]: {
                name: newTId,
                children: []
            }
        }));
        setNextTId(prev => prev + 1);
        setNextDId(prev => ({ ...prev, [newTId]: 1 })); // Start D1 counter for this T
    }

    function addDistributionNode(parent) {
        const distNumber = nextDId[parent];
        const newDId = `${parent}-D${distNumber}`; // e.g. T1-D1, T1-D2

        const updatedParent = {
            ...nodes[parent],
            children: [...nodes[parent].children, newDId]
        };

        setNodes({
            ...nodes,
            [parent]: updatedParent
        });

        setNextDId(prev => ({
            ...prev,
            [parent]: distNumber + 1
        }));
    }

    function removeTransmissionNode(nodeId) {
        const updatedNodes = { ...nodes };
        delete updatedNodes[nodeId];
        setNodes(updatedNodes);
    }

    function removeDistributionNode(nodeId) {
        const updatedNodes = { ...nodes };

        for (const [key, node] of Object.entries(updatedNodes)) {
            if (node.children.includes(nodeId)) {
                updatedNodes[key] = {
                    ...node,
                    children: node.children.filter(id => id !== nodeId)
                };
                break;
            }
        }

        setNodes(updatedNodes);
    }

    function createTransmissionNodeCard(node) {
        return (
            <div className='relative flex flex-col gap-1 h-25 w-full p-4 bg-black/5 rounded-lg' key={node.name}>
                <span className="font-bold">GridPack - {node.name}</span>
                <span className="text-sm"><strong>ID:</strong> {node.name}</span>
                <span className="text-sm"><strong>Child Nodes:</strong> {Object.keys(node.children).length}</span>
                <div className="absolute right-4 bottom-4 flex flex-row gap-2 justify-center items-center">
                    <div className="flex items-center justify-center h-6 w-6 cursor-pointer" onClick={() => removeTransmissionNode(node.name)}>
                        <Trash2 className="h-5 w-5 text-[#fb4b4b]/75 fill-[#fb4b4b]/75 hover:text-[#fb4b4b] hover:fill-[#fb4b4b]" />
                    </div>
                    <button
                        onClick={() => addDistributionNode(node.name)}
                        className="bg-corvid-primary/50 hover:bg-corvid-primary h-8 w-8 rounded-full border-0
                    flex items-center justify-center overflow-hidden p-0 transition-transform duration-300
                    ease-in-out group"
                    >
                        <div className="relative flex items-center justify-center h-6 w-6 cursor-pointer">
                            <Plug2 className="absolute h-5 w-5 text-white transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:rotate-90" />
                            <Plus className="absolute h-5 w-5 text-white opacity-0 -rotate-90 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:rotate-0" />
                        </div>
                    </button>

                </div>
            </div>
        )
    }

    function createDistributionNodeCard(distId) {
        const parentId = Object.entries(nodes).find(([, node]) =>
            node.children.includes(distId)
        )[0];

        return (
            <div className='relative flex flex-col gap-1 h-25 w-full p-4 bg-black/5 rounded-lg' key={distId}>
                <span className="font-bold">GridLab-D - {distId}</span>
                <span className="text-sm"><strong>ID:</strong> {distId}</span>
                <span className="text-sm"><strong>Parent:</strong> {parentId}</span>
                <div className="absolute right-4 bottom-4 flex flex-row gap-2 justify-center items-center">
                    <div className="flex items-center justify-center h-6 w-6 cursor-pointer" onClick={() => removeDistributionNode(distId)}>
                        <Trash2 className="h-5 w-5 text-[#fb4b4b]/75 fill-[#fb4b4b]/75 hover:text-[#fb4b4b] hover:fill-[#fb4b4b]" />
                    </div>
                </div>

            </div>
        )
    }

    async function sendConfiguration() {
        try {
            const response = await fetch('/api/generate-configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    baseDir: './output', // or whatever path you're using server-side
                    simName: simName,
                    nodes
                })
            });

            const data = await response.json();
            if (response.ok) {
                console.log('Success:', data.message);
            } else {
                console.error('Error:', data.error);
            }
        } catch (err) {
            console.error('Request failed:', err);
        }
    }

    return (
        <Page metadata={'Components'}>
            <div className="flex flex-row items-center gap-2 w-full">
                <span>Simulation Name:</span>
                <input
                    className="w-[500px]"
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Enter a simulation name"
                />
            </div>
            <div className="flex flex-row gap-4 h-full w-full grow min-h-0">
                <div className="flex flex-col gap-2 flex-1 w-full h-full overflow-hidden">
                    <div className="flex justify-between items-center font-bold h-8">
                        <span>Transmission Nodes</span>
                        <button
                            className="flex flex-row items-center gap-1 px-2 w-fit min-h-8 h-8 
                            bg-transparent text-corvid-blue border-2 border-corvid-blue 
                            rounded-sm font-bold cursor-pointer"
                            onClick={() => createTransmissionNode()}
                        >Add Node<Plus /></button>
                    </div>
                    <div className="flex flex-col grow min-h-0 overflow-y-auto gap-2 p-4">
                        {Object.values(nodes).map(node => createTransmissionNodeCard(node))}
                    </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 w-full h-full overflow-hidden">
                    <div className="flex justify-between items-center font-bold h-8">
                        <span>Distribution Nodes</span>
                    </div>
                    <div className="flex flex-col grow min-h-0 overflow-y-auto gap-2 p-4">
                        {Object.values(nodes)
                            .flatMap(node => node.children)
                            .map(id => createDistributionNodeCard(id))}
                    </div>
                </div>
            </div>
            {Object.keys(nodes).length > 0 &&
                <button
                    className="flex flex-row items-center gap-1 self-end px-2 w-fit min-h-8 h-8 
                            bg-corvid-primary text-white border-2 border-corvid-primary 
                            rounded-sm font-bold cursor-pointer"
                    onClick={() => sendConfiguration()}
                >
                    Build Configuration
                </button>
            }

        </Page>
    )
}