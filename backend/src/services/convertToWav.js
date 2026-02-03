const { exec } = require("child_process");

exports.convertToWav = (input, output) =>
  new Promise((resolve) => {
    exec(`ffmpeg -i ${input} -ar 16000 -ac 1 ${output}`, resolve);
  });
