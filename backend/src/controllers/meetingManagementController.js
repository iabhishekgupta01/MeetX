const { Meeting } = require("../models/meetingModel");

const parseCaptionPayload = ({ captionEntries, captions, captionsJsonText }) => {
  const candidates = [captionEntries, captions, captionsJsonText];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (typeof candidate === "string" && candidate.trim()) {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
      } catch (_error) {
      }
    }
  }

  return [];
};

const normalizeCaptionEntries = (entries, fallback = {}) =>
  entries
    .map((entry) => {
      const timestamp = entry?.timestamp ? new Date(entry.timestamp) : new Date();
      if (Number.isNaN(timestamp.getTime())) return null;

      const text = (entry?.text || "").toString().trim();
      if (!text) return null;

      return {
        timestamp,
        socketId: (entry?.socketId || fallback.socketId || "unknown").toString(),
        userId: (entry?.userId || fallback.userId || "").toString(),
        username: (entry?.username || fallback.username || "User").toString(),
        text
      };
    })
    .filter(Boolean);

/**
 * Generate a unique meeting code
 */
const generateMeetingCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * Create a new meeting
 */
exports.createMeeting = async (req, res) => {
  try {
    const { hostId, hostName, title, description, durationMinutes, durationHours, scheduledFor } = req.body;

    if (!hostId || !hostName) {
      return res.status(400).json({ error: "hostId and hostName are required" });
    }

    const meetingId = Date.now().toString();
    let meetingCode;
    let codeExists = true;

    // Generate unique meeting code
    while (codeExists) {
      meetingCode = generateMeetingCode();
      const existing = await Meeting.findOne({ meetingCode });
      codeExists = !!existing;
    }

    const now = new Date();
    let scheduledAt = null;
    if (scheduledFor) {
      const parsedSchedule = new Date(scheduledFor);
      if (Number.isNaN(parsedSchedule.getTime())) {
        return res.status(400).json({ error: "scheduledFor must be a valid datetime" });
      }
      if (parsedSchedule <= now) {
        return res.status(400).json({ error: "scheduledFor must be in the future" });
      }
      scheduledAt = parsedSchedule;
    }

    // Set expiration from scheduled start (or now if immediate)
    const expirationDurationMinutes = Number(durationMinutes);
    const expirationDurationHours = Number(durationHours);
    const resolvedDurationMinutes =
      Number.isFinite(expirationDurationMinutes) && expirationDurationMinutes > 0
        ? expirationDurationMinutes
        : Number.isFinite(expirationDurationHours) && expirationDurationHours > 0
          ? expirationDurationHours * 60
          : 24 * 60;

    const baseTime = scheduledAt || now;
    const expiresAt = new Date(baseTime.getTime() + resolvedDurationMinutes * 60 * 1000);

    const meeting = new Meeting({
      meetingId,
      meetingCode,
      hostId,
      hostName,
      title: title || "Untitled Meeting",
      description: description || "",
      scheduledFor: scheduledAt,
      expiresAt,
      participants: [
        {
          userId: hostId,
          username: hostName
        }
      ]
    });

    await meeting.save();

    return res.status(201).json({
      message: "Meeting created successfully",
      meeting,
      meetingId,
      meetingCode
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({ error: "Failed to create meeting" });
  }
};

/**
 * Get meeting by code
 */
exports.getMeetingByCode = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    if (!meetingCode) {
      return res.status(400).json({ error: "meetingCode is required" });
    }

    const meeting = await Meeting.findOne({ meetingCode: meetingCode.toUpperCase() });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found. Invalid code." });
    }

    // Check if meeting has expired or ended
    if (!meeting.isActive || new Date() > new Date(meeting.expiresAt)) {
      return res.status(410).json({ 
        error: "Meeting has expired", 
        expired: true,
        expiresAt: meeting.expiresAt 
      });
    }

    return res.json({
      message: "Meeting found",
      meeting,
      meetingId: meeting.meetingId
    });
  } catch (error) {
    console.error("Error getting meeting by code:", error);
    return res.status(500).json({ error: "Failed to get meeting" });
  }
};

/**
 * Get meeting details by meeting ID
 */
exports.getMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const includeInactive = req.query?.includeInactive === "true";

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // By default block expired/ended meetings; allow override for details/history views.
    if (!includeInactive && (!meeting.isActive || new Date() > new Date(meeting.expiresAt))) {
      return res.status(410).json({ 
        error: "Meeting has expired", 
        expired: true,
        expiresAt: meeting.expiresAt 
      });
    }

    return res.json({
      message: "Meeting details retrieved",
      meeting
    });
  } catch (error) {
    console.error("Error getting meeting details:", error);
    return res.status(500).json({ error: "Failed to get meeting details" });
  }
};

/**
 * Add participant to meeting
 */
exports.addParticipant = async (req, res) => {
  try {
    const { meetingId, userId, username } = req.body;

    if (!meetingId || !userId || !username) {
      return res.status(400).json({ error: "meetingId, userId, and username are required" });
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Check if participant already exists
    const existingIndex = meeting.participants.findIndex(p => p.userId === userId);
    
    if (existingIndex !== -1) {
      if (meeting.participants[existingIndex].username !== username) {
        meeting.participants[existingIndex].username = username;
        await meeting.save();
      }
      return res.json({ message: "Participant already in meeting", meeting });
    }

    meeting.participants.push({
      userId,
      username,
      joinedAt: new Date()
    });

    await meeting.save();

    return res.json({
      message: "Participant added successfully",
      meeting
    });
  } catch (error) {
    console.error("Error adding participant:", error);
    return res.status(500).json({ error: "Failed to add participant" });
  }
};

/**
 * Remove participant from meeting
 */
exports.removeParticipant = async (req, res) => {
  try {
    const { meetingId, userId } = req.body;

    if (!meetingId || !userId) {
      return res.status(400).json({ error: "meetingId and userId are required" });
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const participantIndex = meeting.participants.findIndex(p => p.userId === userId);

    if (participantIndex === -1) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Calculate duration and set leftAt time
    const participant = meeting.participants[participantIndex];
    participant.leftAt = new Date();
    participant.duration = Math.floor((participant.leftAt - participant.joinedAt) / 1000); // duration in seconds

    meeting.participants[participantIndex] = participant;

    await meeting.save();

    return res.json({
      message: "Participant removed successfully",
      meeting
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return res.status(500).json({ error: "Failed to remove participant" });
  }
};

/**
 * End meeting
 */
exports.endMeeting = async (req, res) => {
  try {
    const { meetingId, transcript, summary, captionEntries, captions, captionsJsonText } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: "meetingId is required" });
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    meeting.endedAt = new Date();
    meeting.isActive = false;
    // Expire the meeting immediately when it ends
    meeting.expiresAt = new Date();
    
    if (meeting.startedAt) {
      meeting.duration = Math.floor((meeting.endedAt - meeting.startedAt) / 1000); // duration in seconds
    }

    if (transcript) {
      meeting.transcript = transcript;
    }

    if (summary) {
      meeting.summary = summary;
    }

    const incomingCaptions = parseCaptionPayload({ captionEntries, captions, captionsJsonText });
    if (incomingCaptions.length > 0) {
      const normalizedEntries = normalizeCaptionEntries(incomingCaptions);
      if (normalizedEntries.length > 0) {
        meeting.liveCaptions.push(...normalizedEntries);
      }
    }

    if (meeting.liveCaptions && meeting.liveCaptions.length > 0) {
      const orderedCaptions = [...meeting.liveCaptions]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      meeting.captionsJsonText = JSON.stringify(
        orderedCaptions.map((entry) => ({
          timestamp: new Date(entry.timestamp).toISOString(),
          socketId: entry.socketId,
          userId: entry.userId || "",
          username: entry.username,
          text: entry.text
        }))
      );

      const ordered = orderedCaptions
        .map((entry) => {
          const time = new Date(entry.timestamp).toISOString();
          return `[${time}] ${entry.username}: ${entry.text}`;
        })
        .join("\n");

      if (!meeting.transcript) {
        meeting.transcript = ordered;
      }
    }

    await meeting.save();

    return res.json({
      message: "Meeting ended successfully",
      meeting
    });
  } catch (error) {
    console.error("Error ending meeting:", error);
    return res.status(500).json({ error: "Failed to end meeting" });
  }
};

exports.finalizeMeetingCaptions = async (req, res) => {
  try {
    const { meetingId, userId, username, captions, captionEntries, captionsJsonText } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: "meetingId is required" });
    }

    const incomingCaptions = parseCaptionPayload({ captionEntries, captions, captionsJsonText });
    if (incomingCaptions.length === 0) {
      return res.status(400).json({ error: "captions JSON is required" });
    }

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const normalizedEntries = normalizeCaptionEntries(incomingCaptions, {
      userId,
      username
    });

    if (normalizedEntries.length === 0) {
      return res.status(400).json({ error: "No valid caption entries" });
    }

    meeting.liveCaptions.push(...normalizedEntries);

    const orderedCaptions = [...meeting.liveCaptions]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    meeting.captionsJsonText = JSON.stringify(
      orderedCaptions.map((entry) => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        socketId: entry.socketId,
        userId: entry.userId || "",
        username: entry.username,
        text: entry.text
      }))
    );

    await meeting.save();

    return res.json({
      message: "Caption JSON saved",
      saved: normalizedEntries.length
    });
  } catch (error) {
    console.error("Error finalizing meeting captions:", error);
    return res.status(500).json({ error: "Failed to finalize meeting captions" });
  }
};

/**
 * Get all meetings for a user (as host)
 */
exports.getUserMeetings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const meetings = await Meeting.find({ hostId: userId });

    return res.json({
      message: "User meetings retrieved",
      meetings
    });
  } catch (error) {
    console.error("Error getting user meetings:", error);
    return res.status(500).json({ error: "Failed to get user meetings" });
  }
};

/**
 * Get all meetings user participated in
 */
exports.getUserParticipatedMeetings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const meetings = await Meeting.find({
      "participants.userId": userId
    });

    return res.json({
      message: "User participated meetings retrieved",
      meetings
    });
  } catch (error) {
    console.error("Error getting user participated meetings:", error);
    return res.status(500).json({ error: "Failed to get user participated meetings" });
  }
};
