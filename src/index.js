// require("dotenv").config();
import dotenv from "dotenv";
// import express from "express";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB();

// const app = express();

/*
we can follw this process to connect DB but by doing this it make code messy at index.js


(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}` / `${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
})();
 */
