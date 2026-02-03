

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const userRoute=require("./routes/userRoutes.js");
const meetingRoute = require("./routes/meetingRoutes");

const connectToSocket=require("./controllers/socketManager.js");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const server = createServer(app);
const io =connectToSocket(server);





const mongoUrl = "mongodb+srv://abhishekprince9109:XwQ026jYh83hy22B@meetx.l0xn4ne.mongodb.net/?retryWrites=true&w=majority&appName=MeetX";
main().then(() => {
    console.log("Database connected successfully...");

}).catch(err => console.log(err));

async function main() {
    await mongoose.connect(mongoUrl);
}


app.set("port",8080);


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'],
  credentials: true 
};

app.use(cors(corsOptions));

app.get("/",(req,res)=>{
    res.send("Home page");
});


app.use("/api/v1/meeting", meetingRoute);
app.use("/api/v1/users/",userRoute);



// io.on('connection', (socket) => {
//     console.log('A client connected via WebSocket!');

//     // Handle events from clients
//     socket.on('message', (msg) => {
//         console.log('Received message:', msg);
//         // Send message to all clients
//         io.emit('message', msg);
//     });
// });



server.listen(app.get("port"), (req, res) => {
    console.log("Server listening at port 8080");
});
