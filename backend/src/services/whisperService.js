const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.transcribeAudio = (wavFile) =>
  new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "..", "..", "temp");

    const command = `python -m whisper "${wavFile}" --model small --language hi --output_format txt --output_dir "${outputDir}"`;

    exec(command, (error) => {
      if (error) {
        return reject(error);
      }

      fs.readdir(outputDir, (err, files) => {
        if (err) return reject(err);

        // 🔥 Find the MOST RECENT .txt file
        const txtFiles = files
          .filter((f) => f.endsWith(".txt"))
          .map((f) => ({
            name: f,
            time: fs.statSync(path.join(outputDir, f)).mtimeMs,
          }))
          .sort((a, b) => b.time - a.time);

        if (!txtFiles.length) {
          return reject(new Error("Whisper output not found"));
        }

        const transcriptPath = path.join(outputDir, txtFiles[0].name);
        const transcript = fs.readFileSync(transcriptPath, "utf8");

        resolve(transcript);
      });
    });
  });
