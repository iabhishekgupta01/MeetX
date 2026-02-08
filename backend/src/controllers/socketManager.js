const { Server } = require("socket.io");
const { Meeting } = require("../models/meetingModel");



let connections = {}; //storing socket.id of each user
let messages = {};
let timeOnline = {};
let usernames = {}; // storing username for each socket.id
let socketToMeeting = {}; // mapping socket.id to meetingId
let socketToUserId = {}; // mapping socket.id to userId



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
                const meeting = await Meeting.findOne({ meetingId });
                if (meeting) {
                    const participantIndex = meeting.participants.findIndex(p => p.userId === userId);
                    if (participantIndex === -1) {
                        meeting.participants.push({
                            userId,
                            username,
                            joinedAt: new Date()
                        });
                        await meeting.save();
                    } else if (meeting.participants[participantIndex].username !== username) {
                        meeting.participants[participantIndex].username = username;
                        await meeting.save();
                    }
                    
                    // Emit meeting object to all participants
                    io.to(meetingId).emit("meeting-updated", meeting);
                }

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

