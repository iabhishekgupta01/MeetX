const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadMeetingAudio,
  downloadMeetingFile,
} = require("../controllers/meetingController");

const upload = multer({ dest: "uploads/" });

// upload audio chunks
router.post("/upload", upload.single("file"), uploadMeetingAudio);

// download pdf
router.get("/download/:file", downloadMeetingFile);

module.exports = router;
