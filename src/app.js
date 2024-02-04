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

export { app };
