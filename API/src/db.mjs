import mongoose from "mongoose";

const MONGODB_URI="mongodb+srv://nodejs_api:Ud6DB3dYuojV2s8e@audiosampler.z1ttokk.mongodb.net/AudioSampler?appName=AudioSampler";

export async function connectDB() {
  // Usually it's better to set the MONGODB_URI in the env
  // but we kept it in the code so the API can easily be run in local
  
  const uri = /*process.env.*/MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
