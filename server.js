import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Fix paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1️⃣ Serve static files FIRST (very important)
app.use(express.static(path.join(__dirname, "public")));

// 2️⃣ Access Protection Middleware
app.use((req, res, next) => {

  // Allow API endpoint always
  if (req.path.startsWith("/frontend-loader")) {
    return next();
  }

  // Allow static files automatically (anything containing a dot .)
  if (req.path.includes(".")) {
    return next();
  }

  // Only allow when loaded properly
  const fromLoader = req.headers["x-from-loader"] === "true";
  const viaParam = req.query.loader === "true";

  if (!fromLoader && !viaParam) {
    return res.status(403).send(`
      <h2>Access Restricted</h2>
      <p>This website can only be accessed through the authorized loader script.</p>
    `);
  }

  next();
});

// 3️⃣ Frontend Loader API
app.get("/frontend-loader", (req, res) => {
  const timezone = req.headers["x-client-timezone"] || "";

  console.log("Visitor timezone:", timezone);

  if (timezone !== "Asia/Calcutta") {
    return res.json({ allowed: false, code: null });
  }

  res.json({
    allowed: true,
    code: `console.log("Static site loaded via loader script");`
  });
});

// 4️⃣ Fallback for all frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 5️⃣ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
