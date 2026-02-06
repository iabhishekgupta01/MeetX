const fs = require("fs");
const path = require("path");

const { convertToWav } = require("../services/convertToWav");
const { transcribeAudio } = require("../services/whisperService");
const { summarizeMeeting } = require("../services/summarizeService");
const { generatePdf } = require("../services/pdfService");

/**
 * Upload audio chunks.
 * Runs Whisper + PDF generation ONLY when final=true
 */
exports.uploadMeetingAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const meetingId = req.body.meetingId || "default";
    const isFinal = req.body.final === "true";

    const tempDir = path.join(__dirname, "..", "..", "temp");
    const rawAudioPath = path.join(tempDir, `${meetingId}.webm`);

    // ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // append chunk to meeting file
    fs.appendFileSync(rawAudioPath, fs.readFileSync(req.file.path));

    console.log("CHUNK SAVED", isFinal ? "(FINAL)" : "");

    // cleanup multer temp file
    fs.unlink(req.file.path, () => {});

    // do NOT process until final chunk
    if (!isFinal) {
      // respond immediately (IMPORTANT)
      return res.json({ ok: true });
    }

    console.log("FINAL AUDIO RECEIVED — PROCESSING");

    const wavPath = path.join(tempDir, `${meetingId}.wav`);

    await convertToWav(rawAudioPath, wavPath);
    console.log("WAV DONE");

    const transcript = await transcribeAudio(wavPath);
    console.log("WHISPER DONE");
    console.log("TRANSCRIPT LENGTH:", transcript.length, "chars");
    console.log("TRANSCRIPT PREVIEW:", transcript.substring(0, 200));

    let meetingData;
    try {
      meetingData = await summarizeMeeting(transcript);
      console.log("SUMMARY DONE");
    } catch (summaryErr) {
      console.error("SUMMARY FAILED, USING FALLBACK ❗", summaryErr.message);
      meetingData = {
        title: "Meeting Transcript",
        agenda: ["Meeting discussion recorded and transcribed"],
        overview: transcript.slice(0, 2000) || "[No transcript available]",
        discussion: [transcript] || ["[No discussion content]"],
        decisions: ["[Decisions to be determined from discussion]"],
        action_items: ["[Action items to be determined from discussion]"],
        summary: transcript.slice(0, 2000) || "[No summary available]",
      };
      console.log("FALLBACK DATA CREATED - overview length:", meetingData.overview.length);
    }

    console.log("PDF meetingId =", meetingId);

    const pdfFile = await generatePdf(meetingData, meetingId);
    console.log("PDF GENERATED:", pdfFile);

    console.log("PDF filename =", pdfFile);

    return res.json({ ok: true, fileName: pdfFile });

  } catch (err) {
    console.error("MEETING PIPELINE FAILED ❌", err);
    return res.status(500).json({ error: "Meeting processing failed" });
  }
};

/**
 * Download generated PDF
 */
exports.downloadMeetingFile = (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    fileName
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath);
};
