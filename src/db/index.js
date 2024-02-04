import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const url = `${process.env.MONGODB_URI}/${DB_NAME}`;
    console.log(typeof url);
    await mongoose.connect(url);

    console.log(
      `\n MongoDB connected !! DB HOST:` //${connectionInstance.Connection.host}
    );
  } catch (error) {
    console.log("MONGODB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
