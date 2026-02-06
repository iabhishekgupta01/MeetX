const { Meeting } = require("../models/meetingModel");

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
    const { hostId, hostName, title, description, durationHours } = req.body;

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

    // Set expiration time (default 24 hours, or custom duration)
    const expirationDuration = durationHours || 24; // hours
    const expiresAt = new Date(Date.now() + expirationDuration * 60 * 60 * 1000);

    const meeting = new Meeting({
      meetingId,
      meetingCode,
      hostId,
      hostName,
      title: title || "Untitled Meeting",
      description: description || "",
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

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
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
    const { meetingId, transcript, summary } = req.body;

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
