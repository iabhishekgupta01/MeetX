class TranscriptionRecorder {
  constructor({ userId, meetingId, stream }) {
    this.userId = userId;
    this.meetingId = meetingId;
    this.stream = stream;

    this.mediaRecorder = null;
    this.isRecording = false;

    // DEBUG (removable)
    this.chunkCount = 0;
  }

  init() {
    if (!this.stream) {
      console.error("No audio stream provided");
      return;
    }

    if (!this.stream.getAudioTracks || this.stream.getAudioTracks().length === 0) {
      console.error("No audio tracks available in provided stream");
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm"
      });

      this.mediaRecorder.ondataavailable = this.handleData.bind(this);

      console.log("TranscriptionRecorder initialized");
    } catch (err) {
      console.error("Recorder init failed:", err);
    }
  }

  async handleData(event) {
    if (!event.data || event.data.size === 0) return;

    const formData = new FormData();
    formData.append("audio", event.data);
    formData.append("userId", this.userId);
    formData.append("meetingId", this.meetingId);
    formData.append("timestamp", Date.now());

    try {
      await fetch("/upload-audio", {
        method: "POST",
        body: formData
      });

      // DEBUG
      this.chunkCount += 1;
      console.log(`Chunk sent: ${this.chunkCount}`);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }

  start() {
    if (!this.mediaRecorder) return;
    if (this.mediaRecorder.state === "recording") return;

    this.mediaRecorder.start(5000);
    this.isRecording = true;

    console.log("Transcription recording started");
  }

  stop() {
    if (!this.mediaRecorder) return;
    if (this.mediaRecorder.state === "inactive") return;

    this.mediaRecorder.stop();
    this.isRecording = false;

    console.log("Transcription recording stopped");
  }

  destroy() {
    this.stop();

    console.log("Transcription recorder destroyed");
  }
}

export default TranscriptionRecorder;
