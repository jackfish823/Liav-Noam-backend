import express, {Express} from "express";
import mongoose from "mongoose";
import cors from "cors";
import postRoute from "./routes/posts";
import userRoute from "./routes/users";
import commentRoute from "./routes/comments";
import authRoute from "./routes/auth";
import imageRoute from "./routes/images";
import healthRoute from "./routes/health";
import { swaggerSetup } from "./swagger";
import { loadEnvironmentConfig } from "./utils/env";
import fs from "fs";
import path from "path";

loadEnvironmentConfig();

const app = express();

const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

swaggerSetup(app);

app.use("/api/auth", authRoute);
app.use("/api/post", postRoute);
app.use("/api/user", userRoute);
app.use("/api/comment", commentRoute);
app.use("/api/image", imageRoute);
app.use("/api/health", healthRoute);

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Catch-all route to serve index.html for React SPA
app.get('*path', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicPath, 'index.html'));
    } else {
        res.status(404).json({ message: "API route not found" });
    }
});

const initApp = () => {
    return new Promise<Express>((resolve, reject) => {
        const dbUrl = process.env.DATABASE_URL;

        if (!dbUrl) {
            reject("DATABASE_URL is not defined");
            return;
        }

        mongoose
            .connect(dbUrl)
            .then(() => {
                resolve(app);
            });

        const db = mongoose.connection;

        db.on("error", (error) => console.error(error));
        db.once("open", () => console.log("Connected to Database"));
    });
};

export default initApp;
