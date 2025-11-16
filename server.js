import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Fix paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1️⃣ ALWAYS allow static files (CSS, JS, images, fonts, icons)
app.use((req, res, next) => {
  if (
    req.path.startsWith("/css") ||
    req.path.startsWith("/js") ||
    req.path.startsWith("/images") ||
    req.path.startsWith("/assets") ||
    req.path.includes(".") // *.css *.js *.png *.jpg *.ttf *.woff *.svg etc.
  ) {
    return next();
  }
  next();
});

// 2️⃣ Protection ONLY for HTML pages (index.html)
app.use((req, res, next) => {

  // Allow loader API
  if (req.path.startsWith("/frontend-loader")) return next();

  // Allow static files — already handled above
  if (req.path.includes(".")) return next();

  // Loader checks
  const fromLoader = req.headers["x-from-loader"] === "true";
  const viaParam = req.query.loader === "true";

  // Block direct visitors
  if (!fromLoader && !viaParam) {
    return res.status(403).send(`
      <h2>Access Restricted</h2>
      <p>This website can only be viewed from the authorized loader script.</p>
    `);
  }

  next();
});

// 3️⃣ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// 4️⃣ Loader API
app.get("/frontend-loader", (req, res) => {
  const tz = req.headers["x-client-timezone"] || "";

  if (tz !== "Asia/Calcutta") {
    return res.json({ allowed: false, code: null });
  }

  res.json({
    allowed: true,
    code: `console.log("Loaded via external loader script");`,
  });
});

// 5️⃣ Fallback for frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
