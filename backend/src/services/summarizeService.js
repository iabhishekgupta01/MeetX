const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.summarizeMeeting = (transcript) =>
  new Promise((resolve, reject) => {
    const prompt = `
Return ONLY valid JSON.
No explanation. No markdown.

{
  "title": "",
  "agenda": "",
  "overview": "",
  "discussion": "",
  "decisions": [],
  "action_items": [],
  "summary": ""
}

Transcript:
${transcript}
`;

    console.log("OLLAMA: Starting summarization...");

    let resolved = false;
    const inactivityMs = 3 * 60 * 1000; // 2 minutes of no output = timeout
    let inactivityTimeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error("OLLAMA: No output for 2 minutes - timeout");
          reject(new Error("Ollama timeout: no output for 2 minutes. Ensure 'ollama serve' is running and 'llama3' model is available (ollama pull llama3)."));
        }
      }, inactivityMs);
    };

    const tempPromptFile = path.join(__dirname, "..", "..", "temp", `prompt-${Date.now()}.txt`);
    try {
      fs.writeFileSync(tempPromptFile, prompt);
    } catch (e) {
      return reject(new Error("Failed to write prompt file: " + e.message));
    }

    const child = exec(
      `ollama run llama3 < "${tempPromptFile}"`,
      { maxBuffer: 50 * 1024 * 1024 },
      (err, stdout) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(inactivityTimeout);
        
        try { fs.unlinkSync(tempPromptFile); } catch (e) {}
        
        if (err) {
          console.error("OLLAMA ERROR:", err.message);
          return reject(err);
        }

        console.log("OLLAMA: Got output, parsing JSON...");

        const match = stdout.match(/\{[\s\S]*\}/);
        if (!match) {
          console.error("OLLAMA: No JSON found in output. Output length:", stdout.length);
          return reject(new Error("Invalid LLM JSON output"));
        }

        try {
          const result = JSON.parse(match[0]);
          console.log("OLLAMA: JSON parsed successfully");
          resolve(result);
        } catch (parseErr) {
          console.error("OLLAMA: JSON parse error:", parseErr.message);
          reject(parseErr);
        }
      }
    );

    resetInactivityTimer(); // Start timer

    // Reset timer on stdout/stderr output
    if (child.stdout) {
      child.stdout.on("data", () => {
        console.log("OLLAMA OUTPUT RECEIVED");
        resetInactivityTimer();
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        console.log("OLLAMA STDERR:", data.toString().trim());
        resetInactivityTimer();
      });
    }
  });
