import { useEffect, useRef } from "react";

function MeetingRecorder({ localStream, meetingId }) {
  const recorderRef = useRef(null);

  useEffect(() => {
    if (!localStream) return;

    const audioStream = new MediaStream(
      localStream.getAudioTracks()
    );

    const recorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorderRef.current = recorder;

    recorder.ondataavailable = async (e) => {
      if (!e.data.size) return;

      const formData = new FormData();
      formData.append("file", e.data);
      formData.append("meetingId", meetingId);
      formData.append("final", "false");

      try {
        await fetch("http://localhost:8080/api/v1/meeting/upload", {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        console.error("Upload chunk failed:", err);
      }
    };

    recorder.start(5000); // send chunk every 5s

    return () => {
      recorder.stop();
    };
  }, [localStream, meetingId]);

  // 🔥 listen for meeting end
  useEffect(() => {
    const handleEnd = async () => {
      if (!recorderRef.current) return;

      recorderRef.current.ondataavailable = async (e) => {
        if (!e.data.size) return;
        const formData = new FormData();
        formData.append("file", e.data);
        formData.append("meetingId", meetingId);
        formData.append("final", "true");

        try {
          const response = await fetch("http://localhost:8080/api/v1/meeting/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          if (data?.fileName) {
            const link = document.createElement("a");
            link.href = `http://localhost:8080/api/v1/meeting/download/${data.fileName}`;
            link.download = data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (err) {
          console.error("Final upload failed:", err);
        }
      };

      recorderRef.current.stop();
    };

    window.addEventListener("MEETING_END", handleEnd);
    return () =>
      window.removeEventListener("MEETING_END", handleEnd);
  }, [meetingId]);

  return null; // no UI button
}

export default MeetingRecorder;
