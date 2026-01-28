import express, {Express} from "express";
import mongoose from "mongoose";
import cors from "cors";
import postRoute from "./routes/posts";
import userRoute from "./routes/users";
import commentRoute from "./routes/comments";
import authRoute from "./routes/auth";
import imageRoute from "./routes/images";
import dotenv from "dotenv";
import { swaggerSetup } from "./swagger";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.dev" });

const app = express();

const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

swaggerSetup(app);

app.use("/auth", authRoute);
app.use("/post", postRoute);
app.use("/user", userRoute);
app.use("/comment", commentRoute);
app.use("/image", imageRoute);

const initApp = () => {
    return new Promise<Express>((resolve, reject) => {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            reject("DATABASE_URL is not defined");
            return;
        }
        mongoose
            .connect(dbUrl, {})
            .then(() => {
                resolve(app);
            });
        const db = mongoose.connection;
        db.on("error", (error) => console.error(error));
        db.once("open", () => console.log("Connected to Database"));
    });
};

export default initApp;
