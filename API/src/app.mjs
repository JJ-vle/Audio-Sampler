// src/app.mjs — corrigé complet
import express from "express";
import cors from 'cors';
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";

import crypto from "crypto";
import multer from "multer";

// import bd function from db.mjs
import { connectDB } from "./db.mjs";
await connectDB();

import { Preset } from "./models/Preset.mjs";

// import utility functions from utils.mjs
import {
  slugify, safePresetPath, fileExists,
  readJSON, writeJSON, listPresetFiles, validatePreset
} from "./utils.mjs";

export const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors());

// configure multer for file uploads
// storage is diskStorage with destination and filename functions
// multer means "multipart/form-data" which is used for file uploads
// Before HTML5 it was not possible to upload files with AJAX easily
// so we use a form with enctype="multipart/form-data" and method="POST"
// The form can be submitted with JavaScript (e.g., fetch API) or directly by the browser
const upload = multer({
  storage: multer.diskStorage({
    // cb is the callback to indicate where to store the file
    destination: async (req, file, cb) => {
      const folder = req.params.folder || "";
      const destDir = path.join(DATA_DIR, folder);
      await fs.mkdir(destDir, { recursive: true }).catch(() => {});
      cb(null, destDir);
    },
    filename: (req, file, cb) => {
      // Use original filename
      cb(null, file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // limit files to 10MB
});

// --------- Cross-platform paths (Mac/Linux/Windows) ---------
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// PUBLIC_DIR: env var wins, else ../public (absolute path)
export const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? path.resolve(process.env.PUBLIC_DIR)
  : path.resolve(__dirname, "../public");

// DATA_DIR: env var wins, else <PUBLIC_DIR>/presets
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(PUBLIC_DIR, "presets");

// No decodeURIComponent needed anymore; these are file system paths


// Defines where static files are located, for example the file 
// data/presets/Basic Kit/kick.wav
// will be accessible at http://localhost:3000/presets/Basic%20Kit/kick.wav
// The file PUBLIC_DIR/index.html will be served at http://localhost:3000/ or 
// http://localhost:3000/index.html
// app.use should use a path that works on unix and windows
app.use(express.static(PUBLIC_DIR));

// Ensure data dir exists at startup (best-effort)
await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

// ------- Routes -------
// This is where we define the API endpoints (also called web services or routes)
// Each route has a method (get, post, put, patch, delete) and a path (e.g., /api/presets)
// The handler function takes the request (req), response (res), and next (for error handling) as parameters

// Simple health check endpoint, this is generally the first endpoint to test
app.get("/api/health", (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));


// GET list/search
app.get("/api/presets", async (req, res, next) => {
  try {
    // req.query contains optional parameters: q (text search), type (filter by type), factory (true/false)
    // that appear in the URI like that : /api/presets?q=kick&type=drum&factory=true
    // the javascript syntax in the following like uses the JavaScript "destructuring" assignment
    const { q, type, factory } = req.query;

    // Apply filters
    const filter = {};
    if (type) filter.type = new RegExp(`^${type}$`, "i");
    if (factory !== undefined) {
      filter.isFactoryPresets = factory === "true";
    }
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { "samples.name": new RegExp(q, "i") }
      ];
    }
    const presets = await Preset.find(filter).lean();
    
    // Return the filtered list. the.json method sets the Content-Type header and stringifies the object
    res.json(presets);
  } catch (e) { next(e); }
});

// GET one preset by name or slug. slug means a URL-friendly version of the name
app.get("/api/presets/:name", async (req, res) => {
  const preset = await Preset.findOne({
    $or: [{ name: req.params.name }, { slug: req.params.name }]
  });

  if (!preset) return res.status(404).json({ error: "Preset not found" });
  res.json(preset);
});


// POST for creating a new preset
app.post("/api/presets", async (req, res) => {
  const preset = req.body;
  
  // validate the received preset object
  const errs = validatePreset(preset);
  if (errs.length) return res.status(400).json({ errors: errs });

  // check if a preset with the same name already exists
  const exists = await Preset.findOne({ name: preset.name });
  if (exists) return res.status(409).json({ error: "A preset with this name already exists" });

  // Add metadata and save the preset in a json file
  const now = new Date().toISOString();
  const created = await Preset.create({
    ...preset,
    slug: slugify(preset.name),
    updatedAt: now
  });
  
  // return the created preset
  res.status(201).json(created);
});


app.post("/api/presets", async (req, res, next) => {
  try {
    const preset = req.body;

    // validate the received preset object
    const errs = validatePreset(preset);
    if (errs.length) {
      return res.status(400).json({ errors: errs });
    }
    
    // check if a preset with the same name already exists
    const exists = await Preset.findOne({ name: preset.name });
    if (exists) {
      return res.status(409).json({ error: "A preset with this name already exists" });
    }

    // Add metadata and save the preset in a json file
    const now = new Date().toISOString();
    const created = await Preset.create({
      ...preset,
      slug: slugify(preset.name),
      updatedAt: now
    });

    res.status(201).json(created);

  } catch (err) {
    next(err);
  }
});


// POST route for uploading audio sample files (.wav, .mp3 etc./) 
// This route will take as a parameter the sample/folder name where to store the file
// and the file will be available at http://localhost:3000/presets/:folder/:filename
// we can add multiple files with multer. 16 below is the max number of files accepted
// NOTE: THIS CODE IS INCOMPLETE: a folder should be created for each preset
// and the audio files should be stored in that folder.
// Here, if all files (the preset json file and the audio files) are uploaded at once, they all
// will be stored in the same folder, which is not what we want. We want:
// the preset file in the preset folder, and the audio files in a subfolder with the same name
// For example:
// public/presets/Basic Kit.json
// public/presets/Basic Kit/kick.wav
// public/presets/Basic Kit/snare.wav
// etc.
// To do that, we will need to modify later both this code and the front-end code
// We will see that in the next session
app.post("/api/upload/:folder", upload.array("files", 16), async (req, res, next) => {
  try {
    //folder = presetname
    const folder = req.params.folder;
    if (!folder) return res.status(400).json({ error: "Preset name is required." });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    // Find the preset in MongoDB
    const preset = await Preset.findOne({ name: folder });
    if (!preset) return res.status(404).json({ error: "Preset not found" });
    const folderPath = path.join(DATA_DIR, folder);
    await fs.mkdir(folderPath, { recursive: true }).catch(() => {});

    // Build file info and add to preset.samples
    const newSamples = req.files.map(file => ({
      name: path.parse(file.originalname).name,
      url: `/presets/${folder}/${file.filename}`
    }));

    preset.samples = [...preset.samples, ...newSamples];
    await preset.save();

    // Return info about uploaded files
    res.status(201).json({
      uploaded: newSamples.length,
      files: newSamples
    });

  } catch (err) {
    next(err);
  }
});


// PUT for replacing or renaming a preset file completely
app.put("/api/presets/:name", async (req, res) => {
  const preset = req.body ?? {};

  const errs = validatePreset(preset);
  if (errs.length) return res.status(400).json({ errors: errs });

  const now = new Date().toISOString();

  const updated = await Preset.findOneAndUpdate(
    { $or: [{ name: req.params.name }, { slug: req.params.name }] },
    {
      ...preset,
      name: preset.name,
      slug: slugify(preset.name),
      updatedAt: now
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "Preset not found" });
  }

  res.json(updated);
});


// PATCH partial
app.patch("/api/presets/:name", async (req, res) => {
  const existing = await Preset.findOne({
    $or: [{ name: req.params.name }, { slug: req.params.name }]
  });

  if (!existing) {
    return res.status(404).json({ error: "Preset not found" });
  }

  const merged = { ...existing.toObject(), ...req.body };
  merged.name = merged.name ?? existing.name;

  const errs = validatePreset(merged, { partial: true });
  if (errs.length) return res.status(400).json({ errors: errs });

  merged.slug = slugify(merged.name);
  merged.updatedAt = new Date().toISOString();

  const updated = await Preset.findByIdAndUpdate(
    existing._id,
    merged,
    { new: true }
  );

  res.json(updated);
});


// DELETE a preset by name
app.delete("/api/presets/:name", async (req, res) => {
  const deleted = await Preset.findOneAndDelete({
    $or: [{ name: req.params.name }, { slug: req.params.name }]
  });

  if (!deleted) {
    return res.status(404).json({ error: "Preset not found" });
  }

  // We should also delete the corresponding audio files in the folder with the same name
  // get folder path and delete if exists
  const folderPath = path.join(DATA_DIR, deleted.name);
  await fs.rm(folderPath, { recursive: true, force: true }).catch(() => {});

  // 204 means No Content
  res.status(204).send();
});


// POST for seeding multiple presets at once (for testing or initial setup)
app.post("/api/presets:seed", async (req, res, next) => {
  try {
    const arr = Array.isArray(req.body) ? req.body : null;
    if (!arr) return res.status(400).json({ error: "Body must be an array of presets" });

    let created = 0; const slugs = [];
    for (const p of arr) {
      const errs = validatePreset(p);
      if (errs.length) return res.status(400).json({ errors: errs });
      const now = new Date().toISOString();
      const withMeta = { id: p.id || crypto.randomUUID(), slug: slugify(p.name), updatedAt: now, ...p, name: p.name };
      await writeJSON(safePresetPath(p.name), withMeta);
      created++; slugs.push(withMeta.slug);
    }
    res.status(201).json({ created, slugs });
  } catch (e) { next(e); }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});
