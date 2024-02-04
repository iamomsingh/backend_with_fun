// require("dotenv").config();
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(` Server is runnning on port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db conneciton failed !!! ", err);
  });

/*
we can't follw this process to connect DB but by doing this it make code messy at index.js


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
