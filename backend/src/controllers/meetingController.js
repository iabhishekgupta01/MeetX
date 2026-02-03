const path = require("path");
const fs = require("fs");

const { convertToWav } = require("../services/convertToWav");
const { transcribeAudio } = require("../services/whisperService");
const { summarizeMeeting } = require("../services/summarizeService");
const { generatePdf } = require("../services/pdfService");

exports.uploadMeetingAudio = async (req, res) => {
  try {
    const inputPath = req.file.path;
    const wavPath = `temp/${Date.now()}.wav`;

    await convertToWav(inputPath, wavPath);

    const transcript = await transcribeAudio(wavPath);
    const meetingData = await summarizeMeeting(transcript);
    const pdfFile = await generatePdf(meetingData);

    // 🔴 IMPORTANT: return file name
    res.json({ file: pdfFile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Meeting processing failed" });
  }
};

exports.downloadMeetingFile = (req, res) => {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    req.params.file
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath);
};
