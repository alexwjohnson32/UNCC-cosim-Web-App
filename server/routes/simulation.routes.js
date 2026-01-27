// server/routes/simulation.routes.js
import fs from "node:fs";
import path from "node:path";
import { moduleDir } from "../utils/moduleDir.js";

// ===== Paths & Apptainer config =====
const __dirname = moduleDir(import.meta.url, import.meta.dir);

// IMPORTANT: in your Express version you used process.cwd() for PROJECT_ROOT.
// Keep that (it matches how you're likely launching the app from repo root).
const PROJECT_ROOT = path.resolve(process.cwd());

const CONTAINER_SUBDIR = "server/uncc-corvid/scalability"; // where build.sh & run.sh live
const BUILD_DIR = path.join(PROJECT_ROOT, CONTAINER_SUBDIR, "build");
const DEPLOY_DIR = path.join(BUILD_DIR, "deploy");

// Templates (static inputs you copy into deploy/)
const TEMPLATE_DIR = path.resolve("server/templates");
const BASELINE_FILENAME = "baseline_IEEE_8500.glm";
const DISTRIBUTION_MODEL = "IEEE_8500";
const TRANSMISSION_MODEL = "IEEE_118";
const BASELINE_PATH = path.join(TEMPLATE_DIR, DISTRIBUTION_MODEL, BASELINE_FILENAME);

const APP_IMAGE_DEFAULTS = [
    Bun.env.APP_IMAGE,
    path.resolve(PROJECT_ROOT, "..", "..", "..", "uncc_dir", "uncc_images", "rl8_uncc_full_image.sif"),
    "/mnt/shelf1/compile/uncc_dir/uncc_images/rl8_uncc_full_image.sif",
];

function json(data, init = {}) {
    return Response.json(data, init);
}

/**
 * Run apptainer with identity bind so host paths match in container
 * - If detached: return immediately with pid (and unref the process)
 * - Else: collect stdout+stderr and exit code
 */
async function runApptainerExec({ hostRoot, insideCmd, imagePath, detached = false, collectLogs = true }) {
    const hostAbs = path.resolve(hostRoot);
    const containerPwd = path.join(hostAbs, CONTAINER_SUBDIR).replace(/\\/g, "/");

    const args = [
        "exec",
        "--bind", `${hostAbs}:${hostAbs}`,
        "--pwd", containerPwd,
        imagePath,
        "bash", "-lc", insideCmd,
    ];

    const proc = Bun.spawn(["apptainer", ...args], {
        cwd: hostAbs,
        stdout: collectLogs ? "pipe" : "ignore",
        stderr: collectLogs ? "pipe" : "ignore",
    });

    if (detached) {
        // Make sure bun doesn't wait for it (fire-and-forget)
        // Bun docs: proc.unref() detaches from parent lifecycle :contentReference[oaicite:4]{index=4}
        proc.unref();
        return { pid: proc.pid, args, hostAbs, containerPwd, imagePath };
    }

    let log = "";
    if (collectLogs) {
        // Bun docs: stdout/stderr are ReadableStreams; can .text() them :contentReference[oaicite:5]{index=5}
        const [out, err] = await Promise.all([
            proc.stdout?.text().catch(() => "") ?? "",
            proc.stderr?.text().catch(() => "") ?? "",
        ]);
        log = out + err;
    }

    const exitCode = await proc.exited;
    return { code: exitCode, log, args, hostAbs, containerPwd, imagePath };
}

// Apptainer image resolution (env or sensible defaults)
function firstExisting(paths) {
    for (const p of paths) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

function normalizeNodesShape(nodes) {
    const out = {};
    for (const [tId, tNode] of Object.entries(nodes ?? {})) {
        const children = (tNode.children ?? []).map((c) =>
            typeof c === "string" ? { id: c, bus_id: 1 } : { id: c.id, bus_id: c.bus_id ?? 1 }
        );
        out[tId] = { ...tNode, children };
    }
    return out;
}

/* ========== Helpers that create the deploy tree ========== */

function createTransmissionInputs(deployRoot, nodes, onLog = () => { }) {
    const transmissionDir = path.join(deployRoot, "transmission", TRANSMISSION_MODEL);
    fs.mkdirSync(transmissionDir, { recursive: true });

    const templateDir = path.join(TEMPLATE_DIR, TRANSMISSION_MODEL);
    const templateFiles = fs.readdirSync(templateDir);

    for (const [tNodeId] of Object.entries(nodes)) {
        const tNodeDir = path.join(transmissionDir, tNodeId);
        fs.mkdirSync(tNodeDir, { recursive: true });

        for (const file of templateFiles) {
            const src = path.join(templateDir, file);
            const dest = path.join(tNodeDir, file);
            fs.copyFileSync(src, dest);
        }
        onLog(`✔ Transmission: ${tNodeDir}`);
    }
}

function createDistributionInputs(deployRoot, nodes, timezone, startTime, endTime, onLog = () => { }) {
    const ieeeDir = path.join(deployRoot, "distribution", DISTRIBUTION_MODEL);
    fs.mkdirSync(ieeeDir, { recursive: true });

    const baselineTargetPath = path.join(ieeeDir, BASELINE_FILENAME);
    if (!fs.existsSync(baselineTargetPath)) {
        fs.copyFileSync(BASELINE_PATH, baselineTargetPath);
    }
    onLog(`✔ Baseline: ${baselineTargetPath}`);

    for (const tNode of Object.values(nodes)) {
        for (const dNode of tNode.children) {
            const dId = dNode.id;
            const dNodeDir = path.join(ieeeDir, dId);
            fs.mkdirSync(dNodeDir, { recursive: true });

            const glmContent = `#include "../${BASELINE_FILENAME}"

object helics_msg {
    name ${dId};
    configure ${dId}.json;
}
    
clock {
     timezone ${timezone};
     starttime '${startTime}';
     stoptime '${endTime}';
}`;
            const glmPath = path.join(dNodeDir, `${dId}.glm`);
            fs.writeFileSync(glmPath, glmContent, "utf8");

            const jsonConfig = getJSONObject(tNode.name, dId);
            const jsonPath = path.join(dNodeDir, `${dId}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonConfig, null, 2));

            onLog(`✔ Distribution: ${glmPath}`);
            onLog(`✔ Distribution: ${jsonPath}`);
        }
    }
}

function getJSONObject(parent, dNode) {
    return {
        coreInit: "--federates=1",
        coreType: "zmq",
        name: `${dNode}`,
        offset: 0.0,
        period: 1.0,
        uninterruptible: true,
        logfile: `${dNode}.log`,
        log_level: "debug",
        publications: [
            { global: true, key: `${dNode}/Sa`, type: "complex", unit: "VA", info: { object: "HVMV_Sub_HSB", property: "measured_power_A" } },
            { global: true, key: `${dNode}/Sb`, type: "complex", unit: "VA", info: { object: "HVMV_Sub_HSB", property: "measured_power_B" } },
            { global: true, key: `${dNode}/Sc`, type: "complex", unit: "VA", info: { object: "HVMV_Sub_HSB", property: "measured_power_C" } }
        ],
        subscriptions: [
            { required: true, key: `${parent}/Va`, type: "complex", unit: "V", info: { object: "HVMV_Sub_HSB", property: "voltage_A" } },
            { required: true, key: `${parent}/Vb`, type: "complex", unit: "V", info: { object: "HVMV_Sub_HSB", property: "voltage_B" } },
            { required: true, key: `${parent}/Vc`, type: "complex", unit: "V", info: { object: "HVMV_Sub_HSB", property: "voltage_C" } }
        ]
    };
}

function createCosimRunner(deployRoot, name, nodes, durationSec, onLog = () => { }) {
    const federates = [];

    for (const tNode of Object.values(nodes)) {
        const byBus = new Map();
        for (const d of tNode.children) {
            const dId = typeof d === "string" ? d : d.id;
            const bus = typeof d === "string" ? 1 : (Number.isFinite(d.bus_id) ? d.bus_id : 1);
            const arr = byBus.get(bus) ?? [];
            arr.push(dId);
            byBus.set(bus, arr);

            federates.push({
                directory: `distribution/${DISTRIBUTION_MODEL}/${dId}`,
                exec: `gridlabd.sh ${dId}.glm`,
                host: "localhost",
                name: `${dId}`
            });
        }

        const gridlabd_infos = Array.from(byBus.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([bus_id, names]) => ({ bus_id, names }));

        const setupObj = {
            gridpack_name: tNode.name,
            gridlabd_infos,
            total_time: durationSec,
            ln_magnitude: 79600.0
        };

        federates.push({
            directory: `transmission/${TRANSMISSION_MODEL}/${tNode.name}`,
            exec: "/bin/sh -c './powerflow_ex.x helics_setup.json'",
            host: "localhost",
            name: `${tNode.name}`
        });

        const setupPath = path.join(deployRoot, `transmission/${TRANSMISSION_MODEL}/${tNode.name}/helics_setup.json`);
        fs.writeFileSync(setupPath, JSON.stringify(setupObj, null, 2), "utf8");
        onLog(`✔ Created helics_setup.json for ${tNode.name} at ${setupPath}`);
    }

    const template = {
        name,
        logging_path: "",
        broker: { coreType: "zmq", initString: `--federates=${federates.length} --localport=23500` },
        federates
    };

    const outputPath = path.join(deployRoot, "runnable_cosim.json");
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), "utf8");
    onLog(`✔ Created runnable_cosim.json at ${outputPath}`);
}

/**
 * Bun handler mounted at /api/simulation/*
 */
export async function handleSimulation(req, url) {
    const base = "/api/simulation";
    const subPath = url.pathname.slice(base.length) || "/";

    // POST /api/simulation/build
    if (req.method === "POST" && subPath === "/build") {
        try {
            const imagePath = firstExisting(APP_IMAGE_DEFAULTS);
            if (!imagePath) {
                return json({ success: false, error: "Apptainer image not found.", tried: APP_IMAGE_DEFAULTS }, { status: 500 });
            }

            // Your original used './rebuild.sh ${TEMPLATE_DIR}'
            const insideCmd = `./rebuild.sh ${TEMPLATE_DIR}`;

            const { code, log, args, hostAbs, containerPwd } = await runApptainerExec({
                hostRoot: PROJECT_ROOT,
                insideCmd,
                imagePath
            });

            const buildExists = fs.existsSync(BUILD_DIR);
            return json({
                success: buildExists,
                exitCode: Number.isInteger(code) ? code : -1,
                buildDir: BUILD_DIR,
                log,
                apptainer: { args, hostAbs, containerPwd, imagePath }
            });
        } catch (err) {
            return json({ success: false, error: String(err) }, { status: 500 });
        }
    }

    // POST /api/simulation/run
    if (req.method === "POST" && subPath === "/run") {
        try {
            const imagePath = firstExisting(APP_IMAGE_DEFAULTS);
            if (!imagePath) {
                return json({ success: false, error: "Apptainer image not found.", tried: APP_IMAGE_DEFAULTS }, { status: 500 });
            }

            const { pid, args, hostAbs, containerPwd } = await runApptainerExec({
                hostRoot: PROJECT_ROOT,
                insideCmd: "./run.sh",
                imagePath,
                detached: true,
                collectLogs: false,
            });

            return json({
                success: true,
                message: "Apptainer job started.",
                pid,
                startedAt: new Date().toISOString(),
                apptainer: { args, hostAbs, containerPwd, imagePath }
            }, { status: 202 });
        } catch (err) {
            return json({ success: false, error: String(err) }, { status: 500 });
        }
    }

    // POST /api/simulation/config
    if (req.method === "POST" && subPath === "/config") {
        let log = "";

        try {
            const body = await req.json().catch(() => ({}));
            const { simName, timezone, startTime, endTime, durationSec } = body || {};
            let { nodes } = body || {};

            if (!simName || !timezone || !startTime || !endTime || !durationSec || !nodes) {
                return json(
                    { success: false, error: "simName, timezone, startTime, stopTime, durationSec, and nodes are required" },
                    { status: 400 }
                );
            }

            nodes = normalizeNodesShape(nodes);

            if (fs.existsSync(DEPLOY_DIR)) {
                fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
                log += `Removed existing ${DEPLOY_DIR}\n`;
            }
            fs.mkdirSync(DEPLOY_DIR, { recursive: true });
            log += `Created ${DEPLOY_DIR}\n`;

            createTransmissionInputs(DEPLOY_DIR, nodes, (line) => (log += line + "\n"));
            createDistributionInputs(DEPLOY_DIR, nodes, timezone, startTime, endTime, (line) => (log += line + "\n"));
            createCosimRunner(DEPLOY_DIR, simName, nodes, durationSec, (line) => (log += line + "\n"));

            const ok = fs.existsSync(path.join(DEPLOY_DIR, "runnable_cosim.json"));
            return json({ success: ok, deployDir: DEPLOY_DIR, log });
        } catch (err) {
            log += `ERROR: ${String(err)}\n`;
            return json({ success: false, deployDir: DEPLOY_DIR, log, error: String(err) }, { status: 500 });
        }
    }

    return json({ error: "Not found" }, { status: 404 });
}
