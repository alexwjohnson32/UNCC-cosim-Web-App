import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = path.resolve('server/templates');
const BASELINE_FILENAME = 'baseline_IEEE_8500.glm';
const DISTRIBUTION_MODEL = 'IEEE_8500';
const TRANSMISSION_MODEL = 'IEEE_118';
const BASELINE_PATH = path.join(TEMPLATE_DIR, DISTRIBUTION_MODEL, BASELINE_FILENAME);

export const generateConfiguration = (req, res) => {
    const { baseDir, simName, nodes } = req.body;

    if (!baseDir || !simName || !nodes) {
        return res.status(400).json({ error: 'baseDir, simName, and nodes are required' });
    }

    try {
        // Create timestamped config folder
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
        const configFolderName = `${simName}_${timestamp}`;
        const configDir = path.join(path.resolve(baseDir), configFolderName);

        fs.mkdirSync(configDir, { recursive: true });

        createCosimRunner(configDir, simName, nodes);
        createTransmissionInputs(configDir, nodes);
        createDistributionInputs(configDir, nodes);

        res.json({ success: true, message: `Created configuration at ${configDir}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create configuration.' });
    }
};

function createTransmissionInputs(configDir, nodes) {
    const transmissionDir = path.join(configDir, 'transmission', TRANSMISSION_MODEL);
    fs.mkdirSync(transmissionDir, { recursive: true });

    const templateDir = path.join(TEMPLATE_DIR, TRANSMISSION_MODEL);
    const templateFiles = fs.readdirSync(templateDir);

    for (const [tNodeId, tNode] of Object.entries(nodes)) {
        const tNodeDir = path.join(transmissionDir, tNodeId);
        fs.mkdirSync(tNodeDir, { recursive: true });

        for (const file of templateFiles) {
            const src = path.join(templateDir, file);
            const dest = path.join(tNodeDir, file);
            fs.copyFileSync(src, dest);
        }
        console.log(`✔ Created ${tNodeDir}`);
    }
}

/**
 * This function creates the directory structure for the distribution nodes. It will create
 * the baseDir/distribution/<Model>/nodeID directory structure if it doesn't exist, and then
 * create the .glm file and .json file for each node. It will also copy a baseline .glm to
 * the top level model folder.
 * @param {*} baseDir 
 * @param {*} nodes 
 */
function createDistributionInputs(baseDir, nodes) {
    const ieeeDir = path.join(baseDir, 'distribution', DISTRIBUTION_MODEL);
    fs.mkdirSync(ieeeDir, { recursive: true });

    // Copy the baseline once to the IEEE_8500 dir
    const baselineTargetPath = path.join(ieeeDir, BASELINE_FILENAME);
    if (!fs.existsSync(baselineTargetPath)) {
        fs.copyFileSync(BASELINE_PATH, baselineTargetPath);
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

/**
 * This function takes the node ID and will generate the JSON object from the .json file
 * with the relevant names changed to match the node ID.
 * 
 * TODO: In the future there may be other fields that the user can change, but for now we
 * just want to auto generate names.
 * @param {*} dNode - a string ID for the distribution node
 * @returns JSON object with modified fields
 */
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

function createCosimRunner(configDir, name, nodes) {
    const federates = [];

    // Add a federate for each distribution node
    for (const tNode of Object.values(nodes)) {
        federates.push({
            directory: `transmission/IEEE-118/${tNode.name}`,
            exec: "powerflow_ex.x",
            host: "localhost",
            name: `${tNode.name}_fed`
        });

        for (const dNode of tNode.children) {
            federates.push({
                directory: `distribution/IEEE_8500/${dNode}`,
                exec: `gridlabd.sh ${dNode}.glm`,
                host: "localhost",
                name: `${dNode}_fed`
            });
        }
    }

    const template = {
        name,
        logging_path: "",
        broker: {
            coreType: "zmq",
            initString: `--federates=2 --localport=23500`
        },
        federates
    };

    // Write it to the configDir
    const outputPath = path.join(configDir, 'runnable_cosim.json');
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf8');
    console.log(`✔ Created runnable_cosim.json at ${outputPath}`);
}
