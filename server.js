import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Fix paths for ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 0️⃣ Access Protection Middleware
app.use((req, res, next) => {
  const fromLoader = req.headers["x-from-loader"] === "true";
  const viaParam = req.query.loader === "true";

  // Allow API endpoint always
  if (req.path.startsWith("/frontend-loader")) {
    return next();
  }

  // Allow only when loaded from your script
  if (!fromLoader && !viaParam) {
    return res.status(403).send(`
      <h2>Access Restricted</h2>
      <p>This website can only be accessed from the authorized loader script.</p>
    `);
  }

  next();
});

// 1️⃣ Serve your static website from /public
app.use(express.static(path.join(__dirname, "public")));

// 2️⃣ Frontend Loader API
app.get("/frontend-loader", (req, res) => {
  const timezone = req.headers["x-client-timezone"] || "";
  const gclid = req.query.gclid || null;

  console.log("Visitor timezone:", timezone);

  // Timezone filtering
  if (timezone !== "Asia/Calcutta") {
    return res.json({ allowed: false, code: null });
  }

  const code = `
    console.log("Static site loaded via loader script");
  `;

  res.json({ allowed: true, code });
});

// 3️⃣ Fallback: If no route matches, send index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 4️⃣ Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
