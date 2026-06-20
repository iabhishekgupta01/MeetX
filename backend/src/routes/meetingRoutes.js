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



// Meeting Management Routes
router.post("/create", createMeeting);
router.post("/join", addParticipant);
router.post("/leave", removeParticipant);
router.post("/end", endMeeting);
router.get("/user/:userId/hosted", getUserMeetings);
router.get("/user/:userId/participated", getUserParticipatedMeetings);
router.get("/code/:meetingCode", getMeetingByCode);
router.get("/:meetingId", getMeetingDetails);


module.exports = router;