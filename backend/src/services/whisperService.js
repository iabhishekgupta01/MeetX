const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.transcribeAudio = (wavFile) =>
  new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "..", "..", "temp");
    const baseName = path.basename(wavFile, ".wav");
    const transcriptPath = path.join(outputDir, `${baseName}.txt`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const model = process.env.WHISPER_MODEL || "tiny";
    const language = process.env.WHISPER_LANG || "hi";

    const commonArgs = [
      "-m",
      "whisper",
      wavFile,
      "--model",
      model,
      "--language",
      language,
      "--output_format",
      "txt",
      "--output_dir",
      outputDir,
      "--fp16",
      "False",
    ];

    const candidates = [];

    if (process.env.PYTHON_BIN) {
      candidates.push({ bin: process.env.PYTHON_BIN, args: commonArgs });
    }

    if (process.platform === "win32") {
      candidates.push({ bin: "py", args: ["-3", ...commonArgs] });
      candidates.push({ bin: "python", args: commonArgs });
    } else {
      candidates.push({ bin: "python3", args: commonArgs });
      candidates.push({ bin: "python", args: commonArgs });
    }

    // Fallback to direct whisper CLI if available on PATH
    candidates.push({ bin: "whisper", args: commonArgs.slice(1) });

    const runCandidate = (index) => {
      if (index >= candidates.length) {
        return reject(
          new Error(
            "No valid Python/Whisper executable found. Set PYTHON_BIN or ensure python/py/whisper is on PATH."
          )
        );
      }

      const { bin, args } = candidates[index];
      console.log("WHISPER CMD:", bin, args.join(" "));

      let finished = false;
      const inactivityMs = 3 * 60 * 1000; // 2 minutes of no output = timeout
      let inactivityTimeout;

      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
          if (!finished) {
            finished = true;
            proc.kill();
            reject(new Error("Whisper: no output for 2 minutes. Process may be stuck."));
          }
        }, inactivityMs);
      };

      const proc = spawn(bin, args, { windowsHide: true });
      resetInactivityTimer(); // Start timer immediately

      proc.stdout.on("data", (data) => {
        console.log("[WHISPER STDOUT]", data.toString().trim());
        resetInactivityTimer(); // Reset timer on output
      });

      proc.stderr.on("data", (data) => {
        console.log("[WHISPER STDERR]", data.toString().trim());
        resetInactivityTimer(); // Reset timer on output
      });

      proc.on("error", (error) => {
        if (finished) return;
        finished = true;
        clearTimeout(inactivityTimeout);
        if (error.code === "ENOENT") {
          console.log(`[${bin}] not found, trying next candidate...`);
          return runCandidate(index + 1);
        }
        console.error("WHISPER ERROR:", error);
        reject(error);
      });

      proc.on("close", (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(inactivityTimeout);
        console.log("[WHISPER CLOSE] Exit code:", code);
        if (code !== 0) {
          return reject(new Error(`Whisper exited with code ${code}`));
        }

        if (!fs.existsSync(transcriptPath)) {
          return reject(new Error("Whisper output file not found"));
        }

        const transcript = fs.readFileSync(transcriptPath, "utf8");
        resolve(transcript);
      });
    };

    runCandidate(0);
  });
