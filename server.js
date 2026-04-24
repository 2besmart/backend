require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
///const fetch = require("node-fetch");

const app = express();

app.use(express.json());
const cors = require("cors");

app.use(cors({
    origin: "https://printreadevarsiiluzie.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
}));
app.options("*", cors());
app.post("/run", async (req, res) => {

    const { script, input } = req.body;

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            script: script,
            stdin: input,
            language: "cpp17",
            versionIndex: "0"
        })
    });

    const data = await response.json();
    res.json(data);
});
const path = require("path");

app.get("/download-word", (req, res) => {
    const filePath = path.join(__dirname, "files", "document.docx");
    res.download(filePath);
});

app.post("/send-mail", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "Mesaj nou de pe site",
            text: `
            Nume: ${name}
            Email: ${email}
            Subiect: ${subject}
            Mesaj: ${message}
            `
        });
        
        res.json({ success: true });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));