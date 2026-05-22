require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const { GoogleGenAI } = require('@google/genai');

const app = express();

// Setăm middleware-urile o singură dată, la început
app.use(express.json());
app.use(cors({
    origin: "https://printreadevarsiiluzie.netlify.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

// RUTA 1: Compilator JDoodle C++
app.post("/run", async (req, res) => {
    try {
        const fetch = global.fetch;
        const { script, input } = req.body;

        const response = await fetch("https://api.jdoodle.com/v1/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                script,
                stdin: input,
                language: "cpp17",
                versionIndex: "0"
            })
        });

        const data = await response.json();
        res.json(data);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RUTELE 2 & 3: Descărcare fișiere
app.get("/download-word", (req, res) => {
    const filePath = path.join(__dirname, "files", "document.docx");
    res.download(filePath);
});

app.get("/download-pdf", (req, res) => {
    const filePath = path.join(__dirname, "files", "prezentare.pdf");
    res.download(filePath);
});

// Configurare Nodemailer (Securizată prin process.env)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "oncsgraf@gmail.com",
        pass: process.env.EMAIL_PASS // <-- securizat!
    }
});

// RUTA 4: Trimitere Email
app.post("/send-email", async (req, res) => {
    const { name, fromEmail, subject, message } = req.body;

    const mailOptions = {
        from: `"${name}" <${fromEmail}>`,
        to: "oncsgraf@gmail.com",
        subject: subject,
        text: `Nume expeditor: ${name}\nEmail expeditor: ${fromEmail}\n\nMesaj:\n${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

// Configurare Google Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemPrompt = `Ești un generator de quiz-uri. Primești un text și trebuie să generezi EXACT 10 întrebări de tip Adevărat/Fals în limba română sub formă de obiect JSON. 
Fiecare întrebare trebuie să aibă textul întrebării, valoarea corectă și o explicație scurtă de ce este adevărat sau fals pe baza textului.
Formatul trebuie să fie STRICT o listă validă de obiecte JSON (fără caractere Markdown precum \`\`\`json la început):
[
  {"id": 1, "text": "...", "correct": true, "explicatie": "..."},
  {"id": 2, "text": "...", "correct": false, "explicatie": "..."}
]`;

// RUTA 5: Generator Quiz cu AI
app.post('/generate-quiz', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Textul lipsește." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Instrucțiuni: ${systemPrompt}\n\nText sursă: ${text}`,
            config: {
                responseMimeType: "application/json"
            }
        });

        const aiResponseString = response.text;
        const quizData = JSON.parse(aiResponseString);
        const finalQuestions = Array.isArray(quizData) ? quizData : (quizData.questions || Object.values(quizData)[0]);

        res.json(finalQuestions);

    } catch (error) {
        console.error("Eroare la Gemini:", error);
        res.status(500).json({ error: "A apărut o eroare la generarea quiz-ului." });
    }
});

const fs = require("fs");
const REVIEWS_FILE = path.join(__dirname, "reviews.json");

// Funcție ajutătoare: Citește review-urile din fișier
const readReviews = () => {
    try {
        if (!fs.existsSync(REVIEWS_FILE)) {
            // Dacă fișierul nu există, îl creăm gol
            fs.writeFileSync(REVIEWS_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
        return JSON.parse(data || "[]");
    } catch (error) {
        console.error("Eroare la citirea review-urilor:", error);
        return [];
    }
};

// Funcție ajutătoare: Salvează review-urile în fișier
const saveReviews = (reviews) => {
    try {
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    } catch (error) {
        console.error("Eroare la salvarea review-urilor:", error);
    }
};

// RUTA A: Ia toate review-urile ca să le afișezi pe pagină
app.get("/reviews", (req, res) => {
    const reviews = readReviews();
    res.json(reviews);
});

// RUTA B: Primește un review nou și îl salvează
app.post("/reviews", (req, res) => {
    const { name, text, rating } = req.body;

    if (!name || !text) {
        return res.status(400).json({ error: "Numele și mesajul sunt obligatorii." });
    }

    const reviews = readReviews();
    
    // Creăm obiectul pentru review-ul nou
    const newReview = {
        id: Date.now(), // ID unic bazat pe timp
        name,
        text,
        rating: Number(rating) || 5,
        date: new Date().toLocaleDateString("ro-RO")
    };

    reviews.unshift(newReview); // Adaugă review-ul nou la începutul listei
    saveReviews(reviews);

    res.json({ success: true, review: newReview });
});

// Pornire Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});