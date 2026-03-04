import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const sqlite = new Database("sqlite.db");
  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS weeks (
      id TEXT PRIMARY KEY,
      notes TEXT DEFAULT '',
      notes_height INTEGER DEFAULT 200
    );
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id TEXT NOT NULL,
      date TEXT NOT NULL,
      url TEXT NOT NULL,
      decoration_type TEXT NOT NULL,
      rotation INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      FOREIGN KEY(image_id) REFERENCES images(id) ON DELETE CASCADE
    );
  `);

  app.get("/api/week/:weekId", async (req, res) => {
    const { weekId } = req.params;
    try {
      const weekData = db.select().from(schema.weeks).where(eq(schema.weeks.id, weekId)).get();
      const weekImages = db.select().from(schema.images).where(eq(schema.images.weekId, weekId)).all();
      const imagesWithTags = await Promise.all(weekImages.map(async (img) => {
        const imgTags = db.select().from(schema.tags).where(eq(schema.tags.imageId, img.id)).all();
        return { ...img, tags: imgTags };
      }));
      res.json({ notes: weekData?.notes || "", notesHeight: weekData?.notesHeight || 200, images: imagesWithTags });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch week data" });
    }
  });

  app.post("/api/week/:weekId/notes", async (req, res) => {
    const { weekId } = req.params;
    const { notes, notesHeight } = req.body;
    try {
      const existing = db.select().from(schema.weeks).where(eq(schema.weeks.id, weekId)).get();
      if (existing) {
        db.update(schema.weeks).set({ notes, notesHeight }).where(eq(schema.weeks.id, weekId)).run();
      } else {
        db.insert(schema.weeks).values({ id: weekId, notes, notesHeight }).run();
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  app.post("/api/images", async (req, res) => {
    const { weekId, date, url, decorationType, rotation, keywords } = req.body;
    try {
      const result = db.insert(schema.images).values({ weekId, date, url, decorationType, rotation }).run();
      const imageId = Number(result.lastInsertRowid);
      if (keywords && keywords.length > 0) {
        for (const kw of keywords) {
          db.insert(schema.tags).values({ imageId, keyword: kw }).run();
        }
      }
      const newImage = db.select().from(schema.images).where(eq(schema.images.id, imageId)).get();
      const newTags = db.select().from(schema.tags).where(eq(schema.tags.imageId, imageId)).all();
      res.json({ ...newImage, tags: newTags });
    } catch (error) {
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  app.delete("/api/tags/:tagId", async (req, res) => {
    const { tagId } = req.params;
    try {
      db.delete(schema.tags).where(eq(schema.tags.id, Number(tagId))).run();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tag" });
    }
  });

  app.delete("/api/images/:imageId", async (req, res) => {
    const { imageId } = req.params;
    try {
      db.delete(schema.images).where(eq(schema.images.id, Number(imageId))).run();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}
startServer();
