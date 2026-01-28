const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const mongoose = require('mongoose');
const { loginSchema, signupSchema } = require('../utils/input.validation');

module.exports.signup = async (req, res) => {
    try {
        const project = req.project;

        // Zod Validation (Prevents NoSQL Injection too)
        const { email, password, username, ...otherData } = signupSchema.parse(req.body);

        const collectionName = `${project._id}_users`;
        const collection = mongoose.connection.db.collection(collectionName);

        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        const result = await collection.insertOne(newUser);

        const token = jwt.sign(
            { userId: result.insertedId, projectId: project._id },
            project.jwtSecret
        );

        res.status(201).json({
            message: "User registered successfully",
            token: token,
            userId: result.insertedId
        });

    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        res.status(500).json({ error: err.message }); // Fixed: .json()
    }
}

module.exports.login = async (req, res) => {
    try {
        const project = req.project;
        // Validate Input
        const { email, password } = loginSchema.parse(req.body);

        const collectionName = `${project._id}_users`;
        const collection = mongoose.connection.db.collection(collectionName);

        const user = await collection.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Invalid email or password" });

        const token = jwt.sign(
            { userId: user._id, projectId: project._id },
            project.jwtSecret
        );

        res.json({ token });

    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        res.status(500).json({ error: err.message }); // Fixed: .json()
    }
}

module.exports.me = async (req, res) => {
    try {
        const project = req.project;
        const tokenHeader = req.header('Authorization');

        if (!tokenHeader) return res.status(401).json({ error: "Access Denied: No Token Provided" });

        const token = tokenHeader.replace("Bearer ", "");

        try {
            const decoded = jwt.verify(token, project.jwtSecret);
            const collectionName = `${project._id}_users`;
            const collection = mongoose.connection.db.collection(collectionName);

            const user = await collection.findOne({
                _id: new mongoose.Types.ObjectId(decoded.userId)
            });

            if (!user) return res.status(404).json({ error: "User not found" });

            const { password, ...userData } = user;
            res.json(userData);

        } catch (err) {
            return res.status(400).json({ error: "Invalid or Expired Token" });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}