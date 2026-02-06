const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const {
  createMeeting,
  getMeetingDetails,
  addParticipant,
  removeParticipant,
  endMeeting,
  getUserMeetings,
  getUserParticipatedMeetings,
  getMeetingByCode
} = require("../controllers/meetingManagementController");

// Replace with your Groq API Key
const groq = new Groq({ apiKey: process.env.grok });

// Meeting Management Routes
router.post("/create", createMeeting);
router.post("/join", addParticipant);
router.post("/leave", removeParticipant);
router.post("/end", endMeeting);
router.get("/user/:userId/hosted", getUserMeetings);
router.get("/user/:userId/participated", getUserParticipatedMeetings);
router.get("/code/:meetingCode", getMeetingByCode);
router.get("/:meetingId", getMeetingDetails);

// Summarization Route
router.post("/summarize", async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript || transcript.trim().length < 5) {
            return res.status(400).json({ error: "Transcript is too short or missing." });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a professional secretary. Summarize the following meeting transcript into exactly 5 headings:
                    1. Topic
                    2. Overview
                    3. Detailed Description
                    4. Key Takeaways
                    5. Summary
                    Important: Use Hinglish (Hindi + English mix) exactly as heard in the transcript.`
                },
                { role: "user", content: transcript }
            ],
            model: "llama-3.3-70b-versatile", // High speed model
        });

        const formattedText = chatCompletion.choices[0]?.message?.content || "AI failed to generate summary.";
        res.json({ formattedText });

    } catch (error) {
        console.error("Groq Backend Error:", error);
        res.status(500).json({ error: "Groq API error. Check your API key." });
    }
});

module.exports = router;