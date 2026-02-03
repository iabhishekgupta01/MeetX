const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  uploadMeetingAudio,
  downloadMeetingFile,
} = require("../controllers/meetingController");

const upload = multer({ dest: "uploads/" });

// upload meeting recording
router.post("/upload", upload.single("file"), uploadMeetingAudio);

// download generated pdf
router.get("/download/:file", downloadMeetingFile);

module.exports = router;
