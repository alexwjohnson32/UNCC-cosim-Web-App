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
        const fullPath = path.resolve(baseDir);
        fs.mkdirSync(fullPath, { recursive: true });

        createDistributionInputs(nodes, fullPath);

        res.json({ success: true, message: 'Distribution node directories and files created.' });
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
    configure IEEE_8500node.json;
}`;
            const glmPath = path.join(dNodeDir, `${dNode}.glm`);
            fs.writeFileSync(glmPath, glmContent, 'utf8');
            console.log(`✔ Created ${glmPath}`);
        }
    }
}