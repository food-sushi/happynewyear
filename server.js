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

// 1️⃣ ALWAYS allow static assets (css, js, images, fonts)
app.use((req, res, next) => {
  if (
    req.path.includes(".") ||               // *.css, *.js, *.png, *.jpg, *.ttf etc.
    req.path.startsWith("/css") ||
    req.path.startsWith("/js") ||
    req.path.startsWith("/images") ||
    req.path.startsWith("/assets")
  ) {
    return next();
  }
  next();
});

// 2️⃣ PROTECT only HTML pages (not assets)
app.use((req, res, next) => {

  // Allow loader API
  if (req.path.startsWith("/frontend-loader")) return next();

  // Allow static files (handled above)
  if (req.path.includes(".")) return next();

  // Check loader auth
  const fromLoader = req.headers["x-from-loader"] === "true";
  const viaQuery = req.query.loader === "true";

  if (!fromLoader && !viaQuery) {
    return res.status(403).send(`
      <h2>Access Restricted</h2>
      <p>You cannot open this website directly.</p>
    `);
  }

  next();
});

// 3️⃣ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// 4️⃣ Loader API
app.get("/frontend-loader", (req, res) => {
  const timezone = req.headers["x-client-timezone"] || "";

  if (timezone !== "Asia/Calcutta") {
    return res.json({ allowed: false, code: null });
  }

  res.json({
    allowed: true,
    code: `console.log("Loaded through authorized loader");`
  });
});

// 5️⃣ Fallback (index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 6️⃣ Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("SERVER RUNNING on " + PORT));
