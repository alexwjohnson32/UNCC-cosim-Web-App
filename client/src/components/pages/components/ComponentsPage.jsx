// src/pages/ComponentsPage.jsx
import { Plug2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import Page from "../Page";

export default function ComponentsPage() {
    // ----- Simulation model state -----
    const [simName, setSimName] = useState("");
    const [nodes, setNodes] = useState({});
    const [nextTId, setNextTId] = useState(1);
    const [nextDId, setNextDId] = useState({});

    // ----- Pipeline / UI state -----
    const [isBuildingCfg, setIsBuildingCfg] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [canRun, setCanRun] = useState(false);

    // One consolidated log (single pane)
    const [log, setLog] = useState("");
    const [showLog, setShowLog] = useState(false);

    // Errors
    const [error, setError] = useState("");

    // ---------- Helpers ----------
    function now() {
        return new Date().toLocaleString();
    }

    async function fetchJSON(url, options) {
        const res = await fetch(url, options);
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            return { ok: res.ok, status: res.status, data, raw: text };
        } catch {
            // Non-JSON fallback (HTML or plain text)
            return { ok: false, status: res.status, data: null, raw: text };
        }
    }

    function appendLog(sectionTitle, body) {
        setLog((prev) =>
            `${prev}${prev ? "\n\n" : ""}===== ${sectionTitle} @ ${now()} =====\n${body || "(no output)"}`
        );
    }

    // ---------- Node management ----------
    function createTransmissionNode() {
        const newTId = `T${nextTId}`;
        setNodes((prev) => ({
            ...prev,
            [newTId]: { name: newTId, children: [] },
        }));
        setNextTId((prev) => prev + 1);
        setNextDId((prev) => ({ ...prev, [newTId]: 1 }));
    }

    function addDistributionNode(parent) {
        const distNumber = nextDId[parent] ?? 1;
        const newDId = `${parent}-D${distNumber}`;
        const updatedParent = { ...nodes[parent], children: [...nodes[parent].children, newDId] };
        setNodes({ ...nodes, [parent]: updatedParent });
        setNextDId((prev) => ({ ...prev, [parent]: distNumber + 1 }));
    }

    function removeTransmissionNode(nodeId) {
        const updated = { ...nodes };
        delete updated[nodeId];
        setNodes(updated);
    }

    function removeDistributionNode(nodeId) {
        const updated = { ...nodes };
        for (const [k, v] of Object.entries(updated)) {
            if (v.children.includes(nodeId)) {
                updated[k] = { ...v, children: v.children.filter((id) => id !== nodeId) };
                break;
            }
        }
        setNodes(updated);
    }

    // ---------- Cards ----------
    function createTransmissionNodeCard(node) {
        return (
            <div className="relative flex flex-col gap-1 h-25 w-full p-4 bg-black/5 rounded-lg" key={node.name}>
                <span className="font-bold">GridPack - {node.name}</span>
                <span className="text-sm">
                    <strong>ID:</strong> {node.name}
                </span>
                <span className="text-sm">
                    <strong>Child Nodes:</strong> {node.children.length}
                </span>
                <div className="absolute right-4 bottom-4 flex flex-row gap-2 justify-center items-center">
                    <div
                        className="flex items-center justify-center h-6 w-6 cursor-pointer"
                        onClick={() => removeTransmissionNode(node.name)}
                        title="Remove transmission node"
                    >
                        <Trash2 className="h-5 w-5 text-[#fb4b4b]/75 fill-[#fb4b4b]/75 hover:text-[#fb4b4b] hover:fill-[#fb4b4b]" />
                    </div>
                    <button
                        onClick={() => addDistributionNode(node.name)}
                        className="bg-corvid-primary/50 hover:bg-corvid-primary h-8 w-8 rounded-full border-0
                       flex items-center justify-center overflow-hidden p-0 transition-transform duration-300
                       ease-in-out group"
                        title="Add distribution node"
                    >
                        <div className="relative flex items-center justify-center h-6 w-6 cursor-pointer">
                            <Plug2 className="absolute h-5 w-5 text-white transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:rotate-90" />
                            <Plus className="absolute h-5 w-5 text-white opacity-0 -rotate-90 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:rotate-0" />
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    function createDistributionNodeCard(distId) {
        const parentEntry = Object.entries(nodes).find(([, node]) => node.children.includes(distId));
        const parentId = parentEntry ? parentEntry[0] : "—";
        return (
            <div className="relative flex flex-col gap-1 h-25 w-full p-4 bg-black/5 rounded-lg" key={distId}>
                <span className="font-bold">GridLab-D - {distId}</span>
                <span className="text-sm">
                    <strong>ID:</strong> {distId}
                </span>
                <span className="text-sm">
                    <strong>Parent:</strong> {parentId}
                </span>
                <div className="absolute right-4 bottom-4 flex flex-row gap-2 justify-center items-center">
                    <div
                        className="flex items-center justify-center h-6 w-6 cursor-pointer"
                        onClick={() => removeDistributionNode(distId)}
                        title="Remove distribution node"
                    >
                        <Trash2 className="h-5 w-5 text-[#fb4b4b]/75 fill-[#fb4b4b]/75 hover:text-[#fb4b4b] hover:fill-[#fb4b4b]" />
                    </div>
                </div>
            </div>
        );
    }

    // ---------- Actions ----------
    // One button: /api/build then /api/config (uses data.log, not raw)
    async function buildConfiguration() {
        try {
            setIsBuildingCfg(true);
            setError("");
            setLog(""); // reset consolidated log
            setShowLog(true); // show logs; node lists will hide
            setCanRun(false);

            // 1) Build (apptainer)
            const buildRes = await fetchJSON("/api/build", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            // Prefer body.data.log; fallback to raw if missing
            appendLog("BUILD (/api/build)", buildRes.data?.log ?? buildRes.raw);
            if (!buildRes.ok || !buildRes.data?.success) {
                throw new Error(buildRes.data?.error || "Build failed (see log)");
            }

            // 2) Generate configuration (deploy tree under build/deploy)
            const cfgRes = await fetchJSON("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simName: simName || "sim",
                    nodes,
                }),
            });
            appendLog("CONFIG (/api/config)", cfgRes.data?.log ?? cfgRes.raw);
            if (!cfgRes.ok || !cfgRes.data?.success) {
                throw new Error(cfgRes.data?.error || "Generate configuration failed (see log)");
            }

            setCanRun(true);
        } catch (e) {
            setError(String(e?.message || e));
            setCanRun(false);
        } finally {
            setIsBuildingCfg(false);
        }
    }

    // Run: just /api/run (use data.log)
    async function runSim() {
        try {
            setError("");
            setIsRunning(true);
            setShowLog(true); // show logs; node lists will hide

            const runRes = await fetchJSON("/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            appendLog("RUN (/api/run)", runRes.data?.log ?? runRes.raw);
            if (!runRes.ok || !runRes.data?.success) {
                console.warn("Run exited non-OK; see log.");
            }
        } catch (e) {
            setError(String(e?.message || e));
        } finally {
            setIsRunning(false);
        }
    }

    // ---------- Render ----------
    return (
        <Page metadata={"Components"}>
            {/* Full-height column so the log pane can fill */}
            <div className="flex flex-col h-full min-h-0">
                {/* Simulation name */}
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

                {/* Error banner */}
                {error && (
                    <div className="mt-3 p-3 rounded bg-red-100 text-red-800 border border-red-300">
                        {error}
                    </div>
                )}

                {/* Main content area fills remaining height */}
                <div className="mt-4 flex-1 min-h-0">
                    {showLog ? (
                        // LOG VIEW (fills height)
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center">
                                <strong>Logs</strong>
                            </div>
                            <div className="mt-2 flex-1 min-h-0 rounded border border-black/10 bg-white overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-xs font-mono p-2">
                                    {log || "(no logs yet)"}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        // NODE BUILDERS (only visible when logs are hidden)
                        <div className="flex flex-row gap-4 h-full w-full grow min-h-0">
                            <div className="flex flex-col gap-2 flex-1 w-full h-full overflow-hidden">
                                <div className="flex justify-between items-center font-bold h-8">
                                    <span>Transmission Nodes</span>
                                    <button
                                        className="flex flex-row items-center gap-1 px-2 w-fit min-h-8 h-8 
                               bg-transparent text-corvid-blue border-2 border-corvid-blue 
                               rounded-sm font-bold cursor-pointer"
                                        onClick={createTransmissionNode}
                                    >
                                        Add Node<Plus />
                                    </button>
                                </div>
                                <div className="flex flex-col grow min-h-0 overflow-y-auto gap-2 p-4">
                                    {Object.values(nodes).map((node) => createTransmissionNodeCard(node))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 flex-1 w-full h-full overflow-hidden">
                                <div className="flex justify-between items-center font-bold h-8">
                                    <span>Distribution Nodes</span>
                                </div>
                                <div className="flex flex-col grow min-h-0 overflow-y-auto gap-2 p-4">
                                    {Object.values(nodes)
                                        .flatMap((n) => n.children)
                                        .map((id) => createDistributionNodeCard(id))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 self-end">
                <button
                    className="px-3 h-9 bg-corvid-primary text-white border-2 border-corvid-primary 
                       rounded-sm font-bold disabled:opacity-50 cursor-pointer"
                    onClick={buildConfiguration}
                    disabled={isBuildingCfg || Object.keys(nodes).length === 0}
                    title="Build binaries, then generate deploy configuration"
                >
                    {isBuildingCfg ? "Building…" : "Build Configuration"}
                </button>

                <button
                    className="px-3 h-9 bg-transparent text-corvid-blue border-2 border-corvid-blue 
                       rounded-sm font-bold disabled:opacity-50 cursor-pointer"
                    onClick={runSim}
                    disabled={!canRun || isRunning}
                    title="Run the simulation"
                >
                    {isRunning ? "Running…" : "Run"}
                </button>

                {/* Manual toggle for logs vs node lists */}
                <button
                    className="px-3 h-9 bg-transparent text-gray-700 border-2 border-gray-300 
                       rounded-sm font-bold cursor-pointer"
                    onClick={() => setShowLog((s) => !s)}
                    title="Toggle logs view"
                >
                    {showLog ? "Show Nodes" : "Show Logs"}
                </button>
            </div>
        </Page>
    );
}
