import fs from 'fs';
import path from 'path';

export const generateConfiguration = (req, res) => {
    const { baseDir, structure } = req.body;

    if (!baseDir || !structure) {
        return res.status(400).json({ error: 'baseDir and structure are required' });
    }

    try {
        const fullPath = path.resolve(baseDir);
        createStructure(fullPath, structure);
        res.json({ success: true, message: 'Directory structure created.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create directory structure.' });
    }
}

function createStructure(basePath, structure) {
    for (const key in structure) {
        const dirPath = path.join(basePath, key);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        // If there are nested children, recurse
        if (typeof structure[key] === 'object') {
            createStructure(dirPath, structure[key]);
        }
    }
}