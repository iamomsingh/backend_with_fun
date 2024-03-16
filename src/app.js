import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: [
      "https://youtube-twitter.netlify.app",
      "https://youtube-twitter-frontend.onrender.com",
      "http://localhost:5173",
    ],
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
// const allowedOrigins = ["https://youtube-twitter.netlify.app"];
//
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true, // If your frontend sends credentials (cookies, authorization headers)
// };
//
// app.use(cors(corsOptions));

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
import likeRouter from "./routes/likeRoutes.js";
import playlistRouter from "./routes/playlistRoutes.js";
import tweetRouter from "./routes/tweetRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import healthcheckRouter from "./routes/healthcheckRoutes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

export { app };
