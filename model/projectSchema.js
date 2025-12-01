import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    techStack: { type: [String], required: true }, 
    github: { type: String },
    liveDemo: { type: String },
    thumbnail: { type: String },
    featured: { type: Boolean, default: false },
    background: { type: String },
    boxShadow: { type: String }
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
