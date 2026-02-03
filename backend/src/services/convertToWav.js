const { exec } = require("child_process");

exports.convertToWav = (input, output) =>
  new Promise((resolve, reject) => {
    const command = `ffmpeg -y -i "${input}" -ar 16000 -ac 1 "${output}"`;

    exec(command, (error) => {
      if (error) {
        console.error("FFMPEG ERROR:", error);
        return reject(error);
      }
      resolve();
    });
  });
