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
            clientId: "b612e4cac0bea145b892d33726ad23b8",
            clientSecret: "2fa1dc587f1fd055b77ab06341b83daf02c041c93b65635d5ef21c8de4d43d0a",
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
app.listen(3000, () => {
    console.log("Server pornit pe http://localhost:3000");
});