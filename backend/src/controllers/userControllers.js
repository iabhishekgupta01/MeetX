const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const register = async (req, res) => {
    try {
        let { name, username, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            // 409 Conflict
            return res.status(409).json({ message: "User already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            username,
            password: hashedPassword,
        });
        await user.save();

        console.log(user);

        // 201 Created
        return res.status(201).json({ message: "User registered successfully" });
    } catch (e) {
        // 500 Internal Server Error
        return res.status(500).json({ message: `Something went wrong : ${e}` });
    }
};

const login = async (req, res) => {
    let { username, password } = req.body;

    try {
        if (!username || !password) {
            // 400 Bad Request
            return res.status(400).json({ message: "Incorrect password or username" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            // 404 Not Found
            return res.status(404).json({ message: "User does not exist" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            // 200 OK
            return res.status(200).json({ token });
        } else {
            // 401 Unauthorized
            return res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (e) {
        // 500 Internal Server Error
        return res.status(500).json({ message: `Something went wrong : ${e}` });
    }
};

module.exports = { login, register };