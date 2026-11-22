
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

if (!process.env.APP_PASSWORD ||
    !process.env.SESSION_SECRET) {
  console.error("Maxfiy sozlamalar kiritilmagan!");
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));

app.use(session({
  name: "dostai.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

const limiter = rateLimit({
  windowMs: 60000,
  limit: 30
});

function auth(req, res, next) {
  if (req.session.loggedIn) return next();
  res.status(401).json({ error: "Avval tizimga kiring." });
}

app.post("/api/login", (req, res) => {
  if (req.body.password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: "Parol noto'g'ri." });
  }
  req.session.loggedIn = true;
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/status", (req, res) => {
  res.json({
    loggedIn: !!req.session.loggedIn,
    providers: {
      openai: false,
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

app.post("/api/chat", auth, limiter, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API kaliti sozlanmagan.");
    }

    const messages = req.body.messages || [];

    if (!messages.length || messages.length > 30) {
      return res.status(400).json({ error: "Xabarlar soni noto'g'ri." });
    }

    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 12000) }]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
      encodeURIComponent(process.env.GEMINI_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Siz Do'st AI'siz. Foydalanuvchi bilan samimiy o'zbek tilida gaplashing. Savollarga foydali javob bering va so'ralganda ijodiy hikoyalar yozing."
            }]
          },
          contents,
          generationConfig: { temperature: 0.8 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini xatosi.");
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "").join("");

    if (!answer) throw new Error("AI javob bermadi.");

    res.json({ answer });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Dost AI ishga tushdi"));
