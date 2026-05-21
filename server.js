require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

app.use(express.json());

app.use(cors({
    origin: "https://printreadevarsiiluzie.netlify.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

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


app.get("/download-word", (req, res) => {
    const filePath = path.join(__dirname, "files", "document.docx");
    res.download(filePath);
});
app.get("/download-pdf", (req, res) => {
    const filePath = path.join(__dirname, "files", "prezentare.pdf");
    res.download(filePath);
});

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "oncsgraf@gmail.com",
        pass: "chdf iqlx pzkr kqfs"
    }
});

app.post("/send-email", async (req, res) => {
    const { name, fromEmail, subject, message } = req.body;

    const mailOptions = {
        from: `"${name}" <${fromEmail}>`,
        to: "oncsgraf@gmail.com",
        subject: subject,
        text: `
Nume expeditor: ${name}
Email expeditor: ${fromEmail}

Mesaj:
${message}
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

// Inițializăm OpenAI folosind cheia ascunsă în Render
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Promptul de sistem care instruiește AI-ul
const systemPrompt = `Ești un generator de quiz-uri. Primești un text și trebuie să generezi EXACT 10 întrebări de tip Adevărat/Fals în limba română sub formă de obiect JSON. 
Fiecare întrebare trebuie să aibă textul întrebării, valoarea corectă și o explicație scurtă de ce este adevărat sau fals pe baza textului.
Formatul trebuie să fie STRICT o listă validă de obiecte JSON:
[
  {"id": 1, "text": "...", "correct": true, "explicatie": "..."},
  {"id": 2, "text": "...", "correct": false, "explicatie": "..."}
]`;

// Ruta apelată de frontend
app.post('/generate-quiz', async (req, res) => {
    try {
        const { text } = req.body; // textul trimis de utilizator

        if (!text) {
            return res.status(400).json({ error: "Textul lipsește." });
        }

        // Apelul către OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // rapid și extrem de ieftin
            response_format: { type: "json_object" }, // Forțează AI-ul să scoată doar JSON curat
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generează quiz-ul din acest text: ${text}` }
            ],
        });

        // Răspunsul primit de la AI este un string JSON
        const aiResponseString = completion.choices[0].message.content;
        
        // Îl transformăm în obiect JavaScript pentru a-l trimite curat înapoi
        const quizData = JSON.parse(aiResponseString);

        // Trimitem cele 10 întrebări înapoi la frontend
        // Uneori AI-ul pune lista direct sau într-o proprietate (ex: quizData.questions)
        const finalQuestions = Array.isArray(quizData) ? quizData : (quizData.questions || Object.values(quizData)[0]);

        res.json(finalQuestions);

    } catch (error) {
        console.error("Eroare la AI:", error);
        res.status(500).json({ error: "A apărut o eroare la generarea quiz-ului." });
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});