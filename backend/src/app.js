require("dotenv").config(); // 1. Load this first to use process.env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

// Routes & Managers
const userRoute = require("./routes/userRoutes.js");
const meetingRoute = require("./routes/meetingRoutes");
const connectToSocket = require("./controllers/socketManager.js");

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// 2. Use a fallback for the port
const port = process.env.PORT || 8081; 

// 3. Clean up the URL logic
// It's safer to use the one from your .env, but I've put a fallback here
const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://abhishekprince9109:XwQ026jYh83hy22B@meetx.l0xn4ne.mongodb.net/?retryWrites=true&w=majority&appName=MeetX";

// 4. Proper Database Connection
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Database connected successfully...");
    } catch (err) {
        console.error("Database connection error:", err);
    }
}

main();

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true 
};
app.use(cors(corsOptions));

// Routes
app.get("/", (req, res) => {
    res.send("Home page");
});

app.use("/api/v1/meeting", meetingRoute);
app.use("/api/v1/users", userRoute);

// Start Server
server.listen(port, () => {
    console.log(`Server listening at port ${port}`);
});