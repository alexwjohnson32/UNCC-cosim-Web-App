import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// ===== Paths & Apptainer config =====
const PROJECT_ROOT = path.resolve(process.cwd());
const CONTAINER_SUBDIR = 'server/uncc-corvid/scalability'; // where build.sh & run.sh live
const BUILD_DIR = path.join(PROJECT_ROOT, CONTAINER_SUBDIR, 'build');
const DEPLOY_DIR = path.join(BUILD_DIR, 'deploy');

// Templates (static inputs you copy into deploy/)
const TEMPLATE_DIR = path.resolve('server/templates');
const BASELINE_FILENAME = 'baseline_IEEE_8500.glm';
const DISTRIBUTION_MODEL = 'IEEE_8500';
const TRANSMISSION_MODEL = 'IEEE_118';
const BASELINE_PATH = path.join(TEMPLATE_DIR, DISTRIBUTION_MODEL, BASELINE_FILENAME);

// Apptainer image resolution (env or sensible defaults)
function firstExisting(paths) {
    for (const p of paths) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

function normalizeNodesShape(nodes) {
    // Ensures each child is { id, bus_id }, defaulting bus_id=1 if missing.
    const out = {};
    for (const [tId, tNode] of Object.entries(nodes ?? {})) {
        const children = (tNode.children ?? []).map((c, i) =>
            typeof c === "string" ? { id: c, bus_id: 1 } : { id: c.id, bus_id: c.bus_id ?? 1 }
        );
        out[tId] = { ...tNode, children };
    }
    return out;
}

const APP_IMAGE_DEFAULTS = [
    process.env.APP_IMAGE,
    path.resolve(PROJECT_ROOT, '..', '..', '..', 'uncc_dir', 'uncc_images', 'rl8_uncc_full_image.sif'),
    '/mnt/shelf1/compile/uncc_dir/uncc_images/rl8_uncc_full_image.sif'
];

// Run apptainer with identity bind so host paths match in container
function runApptainerExec({ hostRoot, insideCmd, imagePath }) {
    const hostAbs = path.resolve(hostRoot);
    const containerPwd = path.join(hostAbs, CONTAINER_SUBDIR).replace(/\\/g, '/');

    const args = [
        'exec',
        '--bind', `${hostAbs}:${hostAbs}`,
        '--pwd', containerPwd,
        imagePath,
        'bash', '-lc', insideCmd
    ];

    return new Promise((resolve, reject) => {
        const child = spawn('apptainer', args, { stdio: ['ignore', 'pipe', 'pipe'] });
        let log = '';
        child.stdout.on('data', d => { log += d.toString(); });
        child.stderr.on('data', d => { log += d.toString(); });
        child.on('error', reject);
        child.on('close', code => resolve({ code, log, args, hostAbs, containerPwd, imagePath }));
    });
}

/* ============================
 * POST /api/build
 * Build your C++ (via rebuild.sh in the container).
 * Returns: { success, exitCode, buildDir, log, apptainer }
 * ============================ */
export const buildInApptainer = async (req, res) => {
    try {
        const imagePath = firstExisting(APP_IMAGE_DEFAULTS);
        if (!imagePath) {
            return res.status(500).json({ success: false, error: 'Apptainer image not found.', tried: APP_IMAGE_DEFAULTS });
        }

        const { code, log, args, hostAbs, containerPwd } = await runApptainerExec({
            hostRoot: PROJECT_ROOT,
            insideCmd: './rebuild.sh ${TEMPLATE_DIR}',
            imagePath
        });

        const buildExists = fs.existsSync(BUILD_DIR);
        return res.status(200).json({
            success: buildExists,
            exitCode: Number.isInteger(code) ? code : -1,
            buildDir: BUILD_DIR,
            log,
            apptainer: { args, hostAbs, containerPwd, imagePath }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: String(err) });
    }
};

/* ============================
 * POST /api/run
 * Run your sim (via run.sh --existing in the container).
 * Returns: { success, exitCode, log, apptainer }
 * ============================ */
export const runInApptainer = async (req, res) => {
    try {
        const imagePath = firstExisting(APP_IMAGE_DEFAULTS);
        if (!imagePath) {
            return res.status(500).json({ success: false, error: 'Apptainer image not found.', tried: APP_IMAGE_DEFAULTS });
        }

        // TODO: Work on figuring out how to provide the deploy directory as an input argument here
        const { code, log, args, hostAbs, containerPwd } = await runApptainerExec({
            hostRoot: PROJECT_ROOT,
            insideCmd: './run.sh',
            imagePath
        });

        return res.status(200).json({
            success: Number.isInteger(code) ? code === 0 : false,
            exitCode: Number.isInteger(code) ? code : -1,
            log,
            apptainer: { args, hostAbs, containerPwd, imagePath }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: String(err) });
    }
};

/* ============================
 * POST /api/config
 * NEW BEHAVIOR: create `build/deploy` and populate it
 * with runnable_cosim.json + transmission/ + distribution/
 * (This used to write under /output — now everything goes to build/deploy)
 * Body: { simName, nodes }  (baseDir is ignored now)
 * Returns: { success, deployDir, log }
 * ============================ */
export const generateConfiguration = async (req, res) => {
    const { simName, timezone, startTime, endTime, durationSec } = req.body || {};
    let { nodes } = req.body || {};
    if (!simName || !timezone || !startTime || !endTime || !durationSec || !nodes) {
        return res.status(400).json({ success: false, error: 'simName, timezone, startTime, stopTime, durationSec, and nodes are required' });
    }

    // NEW: normalize to { id, bus_id } children
    nodes = normalizeNodesShape(nodes);

    // Simple text log we’ll return for the GUI to display
    let log = '';

    try {
        // 1) Fresh deploy tree under build/
        if (fs.existsSync(DEPLOY_DIR)) {
            fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
            log += `Removed existing ${DEPLOY_DIR}\n`;
        }
        fs.mkdirSync(DEPLOY_DIR, { recursive: true });
        log += `Created ${DEPLOY_DIR}\n`;

        // 2) Populate like the old /output: runnable_cosim.json, transmission/, distribution/
        createTransmissionInputs(DEPLOY_DIR, nodes, (line) => (log += line + '\n'));
        createDistributionInputs(DEPLOY_DIR, nodes, timezone, startTime, endTime, (line) => (log += line + '\n'));
        createCosimRunner(DEPLOY_DIR, simName, nodes, durationSec, (line) => (log += line + '\n'));

        const ok = fs.existsSync(path.join(DEPLOY_DIR, 'runnable_cosim.json'));
        return res.status(200).json({ success: ok, deployDir: DEPLOY_DIR, log });
    } catch (err) {
        log += `ERROR: ${String(err)}\n`;
        return res.status(500).json({ success: false, deployDir: DEPLOY_DIR, log, error: String(err) });
    }
};

/* ========== Helpers that create the deploy tree ========== */

function createTransmissionInputs(deployRoot, nodes, onLog = () => { }) {
    const transmissionDir = path.join(deployRoot, 'transmission', TRANSMISSION_MODEL);
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

/**
 * Create deployRoot/distribution/<Model>/nodeID structure,
 * copy baseline to model-level once, and create per-node .glm/.json.
 */
function createDistributionInputs(deployRoot, nodes, timezone, startTime, endTime, onLog = () => { }) {
    const ieeeDir = path.join(deployRoot, 'distribution', DISTRIBUTION_MODEL);
    fs.mkdirSync(ieeeDir, { recursive: true });

    // Copy the baseline once to the IEEE_8500 dir
    const baselineTargetPath = path.join(ieeeDir, BASELINE_FILENAME);
    if (!fs.existsSync(baselineTargetPath)) {
        fs.copyFileSync(BASELINE_PATH, baselineTargetPath);
    }
    onLog(`✔ Baseline: ${baselineTargetPath}`);

    // Generate files for each distribution node (use child.id)
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
            fs.writeFileSync(glmPath, glmContent, 'utf8');

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
        // Group dNodes by bus_id -> [name,...]
        const byBus = new Map();
        for (const d of tNode.children) {
            // children may be strings or objects; normalize
            const dId = typeof d === "string" ? d : d.id;
            const bus = typeof d === "string" ? 1 : (Number.isFinite(d.bus_id) ? d.bus_id : 1);
            const arr = byBus.get(bus) ?? [];
            arr.push(dId);
            byBus.set(bus, arr);

            // Distribution federate for each dNode (unchanged)
            federates.push({
                directory: `distribution/${DISTRIBUTION_MODEL}/${dId}`,
                exec: `gridlabd.sh ${dId}.glm`,
                host: "localhost",
                name: `${dId}`
            });
        }

        // Build grouped gridlabd_infos: [{ bus_id, names: [...] }, ...]
        const gridlabd_infos = Array.from(byBus.entries())
            .sort((a, b) => a[0] - b[0]) // optional: stable order by bus_id
            .map(([bus_id, names]) => ({ bus_id, names }));

        // Transmission setup (now with grouped infos)
        const setupObj = {
            gridpack_name: tNode.name,
            gridlabd_infos,
            total_time: durationSec,
            ln_magnitude: 79600.0
        };

        // Transmission federate
        federates.push({
            directory: `transmission/${TRANSMISSION_MODEL}/${tNode.name}`,
            exec: "/bin/sh -c './powerflow_ex.x helics_setup.json'",
            host: "localhost",
            name: `${tNode.name}`
        });

        // Write helics_setup.json per T node
        const setupPath = path.join(
            deployRoot,
            `transmission/${TRANSMISSION_MODEL}/${tNode.name}/helics_setup.json`
        );
        fs.writeFileSync(setupPath, JSON.stringify(setupObj, null, 2), "utf8");
        onLog(`✔ Created helics_setup.json for ${tNode.name} at ${setupPath}`);
    }

    // Broker + federates template
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
