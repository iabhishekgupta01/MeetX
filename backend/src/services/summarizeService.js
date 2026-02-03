const { exec } = require("child_process");

exports.summarizeMeeting = (transcript) =>
  new Promise((resolve) => {
    const prompt = `
You are a meeting assistant.

From the transcript below generate JSON with:
title, agenda, overview, discussion, decisions, action_items, summary.

Transcript:
${transcript}
`;

    exec(
      `ollama run llama3 "${prompt.replace(/"/g, '\\"')}"`,
      (err, stdout) => {
        resolve(JSON.parse(stdout));
      }
    );
  });
