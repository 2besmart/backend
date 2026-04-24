require("dotenv").config();
const express = require("express");
///const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));