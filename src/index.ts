import express, {Express} from "express";
import mongoose from "mongoose";
import postRoute from "./routes/posts";
import userRoute from "./routes/users";
import commentRoute from "./routes/comments";
import authRoute from "./routes/auth";
import dotenv from "dotenv";

dotenv.config({ path: ".env.dev" });

const app = express();
app.use(express.json());
app.use("/auth", authRoute);
app.use("/post", postRoute);
app.use("/user", userRoute);
app.use("/comment", commentRoute);

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
