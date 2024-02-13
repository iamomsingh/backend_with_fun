import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

// middleware to accept file from different sources
app.use(express.json({ limit: "16kb" })); // to get data from form in {json} format
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //to get data from url
app.use(express.static("public")); //to get static file(pic, image)
app.use(cookieParser()); //cookie-parser basically used to access the user browser cookie and get access of user website cookie.

//routes import
import userRouter from "./routes/userRoutes.js";
import videoRouter from "./routes/videoRoutes.js";
import subscriptionRouter from "./routes/subscriptionRoutes.js";
import commentRouter from "./routes/commentRoutes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);

export { app };
