import { Plug2, Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
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

    // Sockets
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef(null);
    const logBoxRef = useRef(null);

    useEffect(() => {
        let stopped = false;
        let retry = 0;

        const makeUrlCandidates = () => {
            const isHttps = window.location.protocol === "https:";
            const wss = isHttps ? "wss" : "ws";
            // Primary: dedicated localhost:23555 WS server
            const primary = `${wss}://localhost:23555/ws/logs`;
            // Fallback: same-origin path (useful in dev or if you proxy WS)
            const fallback = `${wss}://${window.location.host}/ws/logs`;
            return [primary, fallback];
        };

        const connect = async () => {
            const urls = makeUrlCandidates();

            for (const url of urls) {
                if (stopped) return;
                try {
                    const ws = new WebSocket(url);
                    wsRef.current = ws;

                    ws.onopen = () => {
                        setWsConnected(true);
                        retry = 0; // reset backoff
                    };
                    ws.onclose = () => {
                        setWsConnected(false);
                        if (stopped) return;
                        scheduleReconnect();
                    };
                    ws.onerror = () => {
                        setWsConnected(false);
                        try { ws.close(); } catch { }
                    };
                    ws.onmessage = async (ev) => {
                        let text;
                        if (typeof ev.data === "string") text = ev.data;
                        else if (ev.data instanceof Blob) text = await ev.data.text();
                        else if (ev.data instanceof ArrayBuffer) text = new TextDecoder().decode(ev.data);
                        else text = String(ev.data);

                        setLog((prev) => (prev ? prev + "\n" + text : text));
                        if (logBoxRef.current) {
                            const el = logBoxRef.current;
                            el.scrollTop = el.scrollHeight;
                        }
                    };

                    // If we got here, we initiated a connection attempt to this url.
                    // Stop trying other candidates; events above will handle success/failure.
                    return;
                } catch (err) {
                    // Bad URL or constructor failure — try next candidate
                    // (Do not throw; never block render.)
                    // console.debug("WS construct failed for", url, err);
                    continue;
                }
            }

            // If all candidates failed at construction time, schedule a reconnect.
            scheduleReconnect();
        };

        const scheduleReconnect = () => {
            if (stopped) return;
            retry = Math.min(retry + 1, 6);
            const delay = Math.min(1000 * 2 ** (retry - 1), 15000); // 1s → 15s cap
            setTimeout(() => {
                if (!stopped) connect();
            }, delay);
        };

        connect();

        return () => {
            stopped = true;
            try { wsRef.current?.close(); } catch { }
            wsRef.current = null;
        };
    }, []);

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

    // Append a single line without section header
    function appendWsLine(setter, line) {
        const text = (line ?? "").toString();
        setter(prev => (prev ? `${prev}\n${text}` : text));
    }

    // ---------- NEW: Date/Time + Duration + TZ label ----------
    const pad2 = (n) => String(n).padStart(2, "0");
    const fmtYMD_HMS = (d) =>
        `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    const toDateInput = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const toTimeInput = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

    // system IANA zone (used only to derive a static label)
    const sysTZ = (() => {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
        catch { return "UTC"; }
    })();

    // Build const like "PST+8PDT" (standard abbr + positive hours + daylight abbr)
    const TIMEZONE_LABEL = useMemo(() => {
        const y = new Date().getFullYear();
        const jan1 = new Date(y, 0, 1);
        const jul1 = new Date(y, 6, 1);

        const abbr = (when) => {
            try {
                const s = new Intl.DateTimeFormat("en-US", {
                    timeZone: sysTZ,
                    timeZoneName: "short",
                    hour: "2-digit",
                }).format(when);
                return s.split(" ").pop() || "UTC";
            } catch {
                return "UTC";
            }
        };

        const stdAbbr = abbr(jan1); // e.g., PST / CST / GMT
        const dstAbbr = abbr(jul1); // e.g., PDT / CDT / GMT

        // Positive hour count for the standard offset (PST -> 8)
        const stdOffsetHours = Math.abs(Math.round(jan1.getTimezoneOffset() / 60));
        return `${stdAbbr}+${stdOffsetHours}${dstAbbr}`;
    }, [sysTZ]);

    // datetime + duration inputs
    const nowLocal = new Date();
    const [dateLocal, setDateLocal] = useState(toDateInput(nowLocal));
    const [timeLocal, setTimeLocal] = useState(toTimeInput(nowLocal));
    const [durHours, setDurHours] = useState(1);
    const [durMinutes, setDurMinutes] = useState(0);

    const durationMinutes = useMemo(() => durHours * 60 + durMinutes, [durHours, durMinutes]);
    const durationSeconds = useMemo(() => durationMinutes * 60.0, [durationMinutes]);

    // Derived datetimes in requested format
    const startDate = useMemo(() => new Date(`${dateLocal}T${timeLocal}:00`), [dateLocal, timeLocal]);
    const START_DATETIME_STR = useMemo(() => fmtYMD_HMS(startDate), [startDate]);
    const END_DATETIME_STR = useMemo(() => {
        const end = new Date(startDate.getTime() + durationMinutes * 60_000);
        return fmtYMD_HMS(end);
    }, [startDate, durationMinutes]);

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
        const updatedParent = {
            ...nodes[parent],
            children: [...nodes[parent].children, { id: newDId, bus_id: 1 }]
        };
        setNodes({ ...nodes, [parent]: updatedParent });
        setNextDId((prev) => ({ ...prev, [parent]: distNumber + 1 }));
    }

    function updateChildBusId(parentId, childId, busId) {
        setNodes(prev => {
            const parent = prev[parentId];
            if (!parent) return prev;
            const updatedChildren = parent.children.map(c => c.id === childId ? { ...c, bus_id: busId } : c);
            return { ...prev, [parentId]: { ...parent, children: updatedChildren } };
        });
    }

    function removeTransmissionNode(nodeId) {
        const updated = { ...nodes };
        delete updated[nodeId];
        setNodes(updated);
    }

    function removeDistributionNode(nodeId) {
        const updated = { ...nodes };
        for (const [k, v] of Object.entries(updated)) {
            if (v.children.some(c => c.id === nodeId)) {
                updated[k] = { ...v, children: v.children.filter(c => c.id !== nodeId) };
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

    function createDistributionNodeCard(child) {
        // Find parent that contains this child
        const parentEntry = Object.entries(nodes).find(([, node]) =>
            node.children.some(c => c.id === child.id)
        );
        const parentId = parentEntry ? parentEntry[0] : "—";

        return (
            <div className="relative flex flex-col gap-1 w-full p-4 bg-black/5 rounded-lg" key={child.id}>
                <span className="font-bold">GridLab-D - {child.id}</span>
                <span className="text-sm"><strong>ID:</strong> {child.id}</span>
                <span className="text-sm"><strong>Parent:</strong> {parentId}</span>

                <div className="flex flex-row gap-1 items-center">
                    <span className="text-sm font-bold">Bus ID:</span>
                    <select
                        id={`bus-${child.id}`}
                        className="w-16 bg-white border-1 rounded-sm"
                        value={child.bus_id}
                        onChange={(e) => updateChildBusId(parentId, child.id, Number(e.target.value))}
                    >
                        {Array.from({ length: 118 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                <div className="absolute right-4 bottom-4 flex flex-row gap-2 justify-center items-center">
                    <div
                        className="flex items-center justify-center h-6 w-6 cursor-pointer"
                        onClick={() => removeDistributionNode(child.id)}
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
                    timezone: TIMEZONE_LABEL,
                    startTime: START_DATETIME_STR,
                    endTime: END_DATETIME_STR,
                    durationSec: durationSeconds,
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
            <div className="flex flex-col h-full min-h-0 pt-4">
                {/* Simulation Options */}
                <div className="flex flex-row p-4 bg-black/5 rounded-sm gap-6 items-end flex-wrap">
                    {/* Simulation name */}
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-sm">Simulation Name</label>
                        <input
                            className="w-[340px] border-b border-black/25 hover:border-black/75 bg-transparent outline-none py-1"
                            type="text"
                            value={simName}
                            onChange={(e) => setSimName(e.target.value)}
                            placeholder="Enter a simulation name"
                        />
                    </div>

                    {/* Start date */}
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-sm">Start date</label>
                        <input
                            type="date"
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={dateLocal}
                            onChange={(e) => setDateLocal(e.target.value)}
                        />
                    </div>

                    {/* Start time + TZ indicator */}
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-sm">Start time</label>
                        <div className="flex items-end gap-2">
                            <input
                                type="time"
                                step="60"
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={timeLocal}
                                onChange={(e) => setTimeLocal(e.target.value)}
                            />
                            <span
                                className="text-xs text-gray-500"
                                title={sysTZ}
                            >
                                {TIMEZONE_LABEL}
                            </span>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-sm">Duration</label>
                        <div className="flex items-end gap-2">
                            <div className="flex flex-row items-end gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={durHours}
                                    onChange={(e) => setDurHours(Math.max(0, parseInt(e.target.value || "0", 10)))}
                                    placeholder="Hours"
                                />
                                <p className="text-xs text-gray-500">Hours</p>
                            </div>
                            <div className="flex flex-row items-end gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={durMinutes}
                                    onChange={(e) => {
                                        const n = Math.min(59, Math.max(0, parseInt(e.target.value || "0", 10)));
                                        setDurMinutes(Number.isFinite(n) ? n : 0);
                                    }}
                                    placeholder="Min"
                                />
                                <p className="text-xs text-gray-500">Minutes</p>
                            </div>
                        </div>
                    </div>
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
                                <span className={`text-xs ${wsConnected ? "text-green-600" : "text-gray-400"}`}>
                                    {wsConnected ? "live" : "offline"}
                                </span>
                            </div>
                            <div
                                ref={logBoxRef}
                                className="mt-2 flex-1 min-h-0 rounded border border-black/10 bg-white overflow-y-auto"
                            >
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
                                        .map(child => createDistributionNodeCard(child))}
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
