const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!APP_PASSWORD || !SESSION_SECRET) {
  console.error("APP_PASSWORD va SESSION_SECRET environment variables sifatida kiritilishi shart.");
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "dostai.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30 });

function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.status(401).json({ error: "Avval parol bilan kiring." });
}

app.post("/api/login", authLimiter, (req, res) => {
  const password = String(req.body?.password || "");
  if (password !== APP_PASSWORD) return res.status(401).json({ error: "Parol noto'g'ri." });
  req.session.loggedIn = true;
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/status", (req, res) => {
  res.json({
    loggedIn: !!req.session?.loggedIn,
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

app.post("/api/chat", requireLogin, apiLimiter, async (req, res) => {
  try {
    const provider = req.body?.provider === "gemini" ? "gemini" : "openai";
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length || messages.length > 30) {
      return res.status(400).json({ error: "Xabarlar soni noto'g'ri (1–30 ta bo'lishi kerak)." });
    }
    const safeMessages = messages.map(m => ({
      role: ["user", "assistant"].includes(m.role) ? m.role : "user",
      content: String(m.content || "").slice(0, 12000)
    }));
    if (safeMessages.some(m => !m.content.trim())) {
      return res.status(400).json({ error: "Bo'sh xabar yuborilmadi." });
    }

    let answer = "";
    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: "OpenAI API kaliti serverga kiritilmagan." });
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-6.2-sol",
          messages: [
            { role: "system", content: "Siz Do'st AI'siz. Foydalanuvchi bilan tabiiy, samimiy o'zbek tilida gaplashing. Savollarga aniq va foydali javob bering. Hikoya so'ralsa, tanlangan janr va uslubga mos ijodiy hikoya yozing." },
            ...safeMessages
          ],
          temperature: 0.8
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `OpenAI xatosi (${response.status})`);
      answer = data.choices?.[0]?.message?.content || "";
    } else {
      if (!process.env.GEMINI_API_KEY) return res.status(400).json({ error: "Gemini API kaliti serverga kiritilmagan." });
      const contents = safeMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL || "gemini-3.8-flash")}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: "Siz Do'st AI'siz. Foydalanuvchi bilan tabiiy, samimiy o'zbek tilida gaplashing. Savollarga aniq va foydali javob bering. Hikoya so'ralsa, ijodiy va qiziqarli hikoya yozing." }] },
            contents,
            generationConfig: { temperature: 0.8 }
          })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `Gemini xatosi (${response.status})`);
      answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    }
    if (!answer) throw new Error("AI javob qaytarmadi.");
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "AI bilan bog'lanishda xatolik." });
  }
});

app.use(express.static("public"));
app.get("*", (req, res) => res.sendFile(require("path").join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Do'st AI ishga tushdi: ${PORT}`));
