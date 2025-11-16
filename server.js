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

// 1️⃣ Allow only CSS/JS/images freely
app.use((req, res, next) => {
  if (
    req.path.startsWith("/css") ||
    req.path.startsWith("/js") ||
    req.path.startsWith("/images") ||
    req.path.includes(".") // fonts, icons, png, svg etc.
  ) {
    return next();
  }
  next();
});

// 2️⃣ Protection middleware — applied BEFORE serving index.html
app.use((req, res, next) => {
  // Allow loader API
  if (req.path.startsWith("/frontend-loader")) return next();

  // Check loader headers
  const fromLoader = req.headers["x-from-loader"] === "true";
  const viaParam = req.query.loader === "true";

  // Block direct access
  if (!fromLoader && !viaParam) {
    return res.status(403).send(`
      <h2>Access Restricted</h2>
      <p>This website can only be viewed from the authorized loader script.</p>
    `);
  }

  next();
});

// 3️⃣ Now serve static files (safe)
app.use(express.static(path.join(__dirname, "public")));

// 4️⃣ Loader API
app.get("/frontend-loader", (req, res) => {
  const tz = req.headers["x-client-timezone"] || "";

  if (tz !== "Asia/Calcutta") {
    return res.json({ allowed: false, code: null });
  }

  res.json({
    allowed: true,
    code: `console.log("Site loaded via loader script");`,
  });
});

// 5️⃣ Fallback → serves index.html only when allowed
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 6️⃣ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
