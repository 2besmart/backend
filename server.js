require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const nodemailer = require("nodemailer");

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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});