import { Router } from "express";
import fs from "fs/promises";

const router = Router();

// Resolve __dirname since ESM doesn't provide it
const components = JSON.parse(
    await fs.readFile(new URL("../db.json", import.meta.url), "utf-8")
).components;

router.get("/", (req, res) => {
    res.json({ success: true, components });
});

export default router;