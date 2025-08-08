import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = path.resolve('server/templates');
const BASELINE_FILENAME = 'baseline_IEEE_8500.glm';
const BASELINE_PATH = path.join(TEMPLATE_DIR, BASELINE_FILENAME);

export const generateConfiguration = (req, res) => {
    const { baseDir, nodes } = req.body;

    if (!baseDir || !nodes) {
        return res.status(400).json({ error: 'baseDir and nodes are required' });
    }

    try {
        // Create timestamped config folder
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
        const configFolderName = `config_${timestamp}`;
        const configDir = path.join(path.resolve(baseDir), configFolderName);

        fs.mkdirSync(configDir, { recursive: true });

        createDistributionInputs(nodes, configDir);

        res.json({ success: true, message: `Created configuration at ${configDir}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create configuration.' });
    }
};

function createDistributionInputs(nodes, baseDir) {
    const ieeeDir = path.join(baseDir, 'distribution', 'IEEE_8500');
    fs.mkdirSync(ieeeDir, { recursive: true });

    // Copy the baseline once to the IEEE_8500 dir
    const baselineTargetPath = path.join(ieeeDir, BASELINE_FILENAME);
    if (!fs.existsSync(baselineTargetPath)) {
        fs.copyFileSync(BASELINE_PATH, baselineTargetPath);
        console.log(`✔ Copied baseline to ${baselineTargetPath}`);
    }

    // Generate files for each distribution node
    for (const tNode of Object.values(nodes)) {
        for (const dNode of tNode.children) {
            const dNodeDir = path.join(ieeeDir, dNode);
            fs.mkdirSync(dNodeDir, { recursive: true });

            const glmContent =
                `#include "../${BASELINE_FILENAME}"

object helics_msg {
    name ${dNode}_conn;
    configure ${dNode}.json;
}`;
            const glmPath = path.join(dNodeDir, `${dNode}.glm`);
            fs.writeFileSync(glmPath, glmContent, 'utf8');
            console.log(`✔ Created ${glmPath}`);

            const jsonConfig = getJSONObject(dNode);
            const jsonPath = path.join(dNodeDir, `${dNode}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonConfig, null, 2));
            console.log(`✔ Created ${jsonPath}`);
        }
    }
}

function getJSONObject(dNode) {
    return {
        coreInit: "--federates=1",
        coreType: "zmq",
        name: `${dNode}_fed`,
        offset: 0.0,
        period: 1.0,
        uninterruptible: true,
        logfile: `${dNode}.log`,
        log_level: "debug",
        publications: [
            {
                global: true,
                key: `${dNode}_conn/Sa`,
                type: "complex",
                unit: "VA",
                info: { object: "HVMV_Sub_HSB", property: "measured_power_A" }
            },
            {
                global: true,
                key: `${dNode}_conn/Sb`,
                type: "complex",
                unit: "VA",
                info: { object: "HVMV_Sub_HSB", property: "measured_power_B" }
            },
            {
                global: true,
                key: `${dNode}_conn/Sc`,
                type: "complex",
                unit: "VA",
                info: { object: "HVMV_Sub_HSB", property: "measured_power_C" }
            }
        ],
        subscriptions: [
            {
                required: true,
                key: "gridpack/Va",
                type: "complex",
                unit: "V",
                info: { object: "HVMV_Sub_HSB", property: "voltage_A" }
            },
            {
                required: true,
                key: "gridpack/Vb",
                type: "complex",
                unit: "V",
                info: { object: "HVMV_Sub_HSB", property: "voltage_B" }
            },
            {
                required: true,
                key: "gridpack/Vc",
                type: "complex",
                unit: "V",
                info: { object: "HVMV_Sub_HSB", property: "voltage_C" }
            }
        ]
    };
}
