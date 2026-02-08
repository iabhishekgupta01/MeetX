// models/Transcript.js
const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema({
    meetingId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    content: [
        {
            user: { type: String, required: true },
            text: { type: String, required: true },
            timestamp: { type: String }
        }
    ]
});

module.exports = mongoose.model("Transcript", transcriptSchema);