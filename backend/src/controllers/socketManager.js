const { Server } = require("socket.io");
const { Meeting } = require("../models/meetingModel");



let connections = {}; //storing socket.id of each user
let messages = {};
let timeOnline = {};
let usernames = {}; // storing username for each socket.id
let socketToMeeting = {}; // mapping socket.id to meetingId
let socketToUserId = {}; // mapping socket.id to userId

const isMeetingExpired = (meeting) => {
    if (!meeting) return true;
    if (!meeting.isActive) return true;
    return new Date() > new Date(meeting.expiresAt);
};

const finalizeMeeting = async (meeting) => {
    if (!meeting || !meeting.isActive) return meeting;
    meeting.endedAt = new Date();
    meeting.isActive = false;
    meeting.expiresAt = new Date();
    if (!meeting.startedAt) {
        meeting.startedAt = meeting.createdAt || new Date();
    }
    meeting.duration = Math.floor((meeting.endedAt - meeting.startedAt) / 1000);
    await meeting.save();
    return meeting;
};



module.exports = (server) => {
   const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});



    io.on("connection", (socket) => {
        console.log("User connected with socket.id= ", socket.id);
        
        

        socket.on("join-call", async (meetingData) => {
            try {
                const { meetingId, userId, username } = meetingData;

                if (!meetingId) {
                    socket.emit("meeting-ended", { reason: "missing-meeting" });
                    socket.disconnect(true);
                    return;
                }

                const meeting = await Meeting.findOne({ meetingId });
                if (!meeting || isMeetingExpired(meeting)) {
                    socket.emit("meeting-ended", { reason: "ended" });
                    socket.disconnect(true);
                    return;
                }

                // Store mappings
                socketToMeeting[socket.id] = meetingId;
                socketToUserId[socket.id] = userId;
                usernames[socket.id] = username;

                if (connections[meetingId] == undefined) {
                    connections[meetingId] = [];
                }
                connections[meetingId].push(socket.id);

                socket.join(meetingId);

                timeOnline[socket.id] = new Date();

                // Update meeting in database
                const participantIndex = meeting.participants.findIndex(p => p.userId === userId);
                if (participantIndex === -1) {
                    meeting.participants.push({
                        userId,
                        username,
                        joinedAt: new Date()
                    });
                    if (!meeting.startedAt) {
                        meeting.startedAt = new Date();
                    }
                    await meeting.save();
                } else if (meeting.participants[participantIndex].username !== username) {
                    meeting.participants[participantIndex].username = username;
                    await meeting.save();
                }
                
                // Emit meeting object to all participants
                io.to(meetingId).emit("meeting-updated", meeting);

                const clientsPayload = connections[meetingId].map((socketId) => ({
                    socketId,
                    username: usernames[socketId] || "User"
                }));

                connections[meetingId].forEach((userSocketId) => {
                    io.to(userSocketId).emit("user-joined", socket.id, clientsPayload);
                });

                if (messages[meetingId] != undefined) {
                    messages[meetingId].forEach((msg) => {
                        io.to(socket.id).emit("chat-message", msg['data'], msg['sender'], msg['socket-id-sender']);
                    });
                }
            } catch (error) {
                console.error("Error in join-call:", error);
            }
        });

        socket.on("signal", (toId, msg) => {
            const senderName = usernames[socket.id] || "User";
            io.to(toId).emit("signal", socket.id, msg, senderName);
        });

        socket.on("admin-end-meeting", async (payload) => {
            try {
                const { meetingId, userId } = payload || {};
                if (!meetingId || !userId) {
                    socket.emit("admin-action-error", { message: "Invalid admin payload" });
                    return;
                }

                const meeting = await Meeting.findOne({ meetingId });
                if (!meeting) {
                    socket.emit("admin-action-error", { message: "Meeting not found" });
                    return;
                }

                if (meeting.hostId !== userId) {
                    socket.emit("admin-action-error", { message: "Not authorized" });
                    return;
                }

                await finalizeMeeting(meeting);
                io.to(meetingId).emit("meeting-ended", { reason: "host-ended" });

                const roomSockets = connections[meetingId] ? [...connections[meetingId]] : [];
                roomSockets.forEach((socketId) => {
                    io.to(socketId).emit("force-removed", { reason: "meeting-ended" });
                    const targetSocket = io.sockets.sockets.get(socketId);
                    if (targetSocket) {
                        targetSocket.disconnect(true);
                    }
                });
                delete connections[meetingId];
            } catch (error) {
                console.error("Error ending meeting via admin:", error);
                socket.emit("admin-action-error", { message: "Failed to end meeting" });
            }
        });

        socket.on("admin-mute-user", async (payload) => {
            try {
                const { meetingId, userId, targetSocketId } = payload || {};
                if (!meetingId || !userId || !targetSocketId) {
                    socket.emit("admin-action-error", { message: "Invalid admin payload" });
                    return;
                }

                const meeting = await Meeting.findOne({ meetingId });
                if (!meeting || meeting.hostId !== userId) {
                    socket.emit("admin-action-error", { message: "Not authorized" });
                    return;
                }

                io.to(targetSocketId).emit("force-mute", { reason: "admin" });
                io.to(meetingId).emit("peer-muted", { socketId: targetSocketId });
            } catch (error) {
                console.error("Error muting user via admin:", error);
                socket.emit("admin-action-error", { message: "Failed to mute user" });
            }
        });

        socket.on("admin-unmute-user", async (payload) => {
            try {
                const { meetingId, userId, targetSocketId } = payload || {};
                if (!meetingId || !userId || !targetSocketId) {
                    socket.emit("admin-action-error", { message: "Invalid admin payload" });
                    return;
                }

                const meeting = await Meeting.findOne({ meetingId });
                if (!meeting || meeting.hostId !== userId) {
                    socket.emit("admin-action-error", { message: "Not authorized" });
                    return;
                }

                io.to(targetSocketId).emit("force-unmute", { reason: "admin" });
                io.to(meetingId).emit("peer-unmuted", { socketId: targetSocketId });
            } catch (error) {
                console.error("Error unmuting user via admin:", error);
                socket.emit("admin-action-error", { message: "Failed to unmute user" });
            }
        });

        socket.on("peer-unmuted", (payload) => {
            try {
                const { meetingId, socketId } = payload || {};
                if (!meetingId || !socketId) return;
                io.to(meetingId).emit("peer-unmuted", { socketId });
            } catch (error) {
                console.error("Error handling peer unmute:", error);
            }
        });

        socket.on("peer-muted", (payload) => {
            try {
                const { meetingId, socketId } = payload || {};
                if (!meetingId || !socketId) return;
                io.to(meetingId).emit("peer-muted", { socketId });
            } catch (error) {
                console.error("Error handling peer mute:", error);
            }
        });

        socket.on("admin-remove-user", async (payload) => {
            try {
                const { meetingId, userId, targetSocketId } = payload || {};
                if (!meetingId || !userId || !targetSocketId) {
                    socket.emit("admin-action-error", { message: "Invalid admin payload" });
                    return;
                }

                const meeting = await Meeting.findOne({ meetingId });
                if (!meeting || meeting.hostId !== userId) {
                    socket.emit("admin-action-error", { message: "Not authorized" });
                    return;
                }

                io.to(targetSocketId).emit("force-removed", { reason: "removed-by-admin" });
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.disconnect(true);
                }

                if (connections[meetingId]) {
                    connections[meetingId] = connections[meetingId].filter((id) => id !== targetSocketId);
                    connections[meetingId].forEach((id) => io.to(id).emit("user-left", targetSocketId));
                    if (connections[meetingId].length === 0) {
                        delete connections[meetingId];
                    }
                }

                const targetUserId = socketToUserId[targetSocketId];
                if (targetUserId) {
                    const participantIndex = meeting.participants.findIndex(p => p.userId === targetUserId);
                    if (participantIndex !== -1) {
                        meeting.participants[participantIndex].leftAt = new Date();
                        meeting.participants[participantIndex].duration = Math.floor(
                            (meeting.participants[participantIndex].leftAt - meeting.participants[participantIndex].joinedAt) / 1000
                        );
                        await meeting.save();
                        io.to(meetingId).emit("meeting-updated", meeting);
                    }
                }
            } catch (error) {
                console.error("Error removing user via admin:", error);
                socket.emit("admin-action-error", { message: "Failed to remove user" });
            }
        });

        socket.on("chat-message", (data, sender) => {

            const meetingId = socketToMeeting[socket.id];
            
            if (!meetingId || !connections[meetingId]) {
                return;
            }

            if(messages[meetingId]==undefined){
                messages[meetingId]=[];
            }
            messages[meetingId].push({"sender":sender, "data":data, "socket-id-sender":socket.id});

            console.log("message :",data,sender,socket.id);

            connections[meetingId].forEach((userId)=>{
                io.to(userId).emit("chat-message",data,sender,socket.id);
            });

        });

        socket.on("user-username", (userName) => {
            usernames[socket.id] = userName;
            console.log(`User ${socket.id} set username to: ${userName}`);

            // Find the room this user is in
            const userRoom = Object.entries(connections).find(([room, users]) => 
                users.includes(socket.id)
            );

            // Broadcast username to all users in the same room
            if (userRoom) {
                const [room, users] = userRoom;
                users.forEach((userId) => {
                    io.to(userId).emit("user-username-update", socket.id, userName);
                });
            }
        });

        socket.on("disconnect", async () => {

            let diffTime=Math.abs(new Date()-timeOnline[socket.id]);

            let key;

            for( const [room,users] of JSON.parse(JSON.stringify(Object.entries(connections)))){

                for(let a=0; a<users.length;a++){

                    if(users[a]==socket.id){
                        key=room;

                        for(let b=0;b<connections[key].length;b++){
                            io.to(connections[key][b]).emit("user-left",socket.id);
                        }

                        let index=connections[key].indexOf(socket.id);
                        connections[key].splice(index,1);

                        if(connections[key].length==0){
                            delete connections[key];
                        }

                    }
                }

            }

            // Update meeting when user leaves
            const meetingId = socketToMeeting[socket.id];
            const userId = socketToUserId[socket.id];
            
            if (meetingId && userId) {
                try {
                    const meeting = await Meeting.findOne({ meetingId });
                    if (meeting) {
                        const participantIndex = meeting.participants.findIndex(p => p.userId === userId);
                        if (participantIndex !== -1) {
                            meeting.participants[participantIndex].leftAt = new Date();
                            meeting.participants[participantIndex].duration = Math.floor(
                                (meeting.participants[participantIndex].leftAt - meeting.participants[participantIndex].joinedAt) / 1000
                            );
                            await meeting.save();
                            io.to(meetingId).emit("meeting-updated", meeting);
                        }
                    }
                } catch (error) {
                    console.error("Error updating meeting on disconnect:", error);
                }
            }

            // Clean up mappings
            delete usernames[socket.id];
            delete timeOnline[socket.id];
            delete socketToMeeting[socket.id];
            delete socketToUserId[socket.id];

        });
    })




    return io;
}

