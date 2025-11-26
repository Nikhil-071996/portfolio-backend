// model/mailModel.js
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, default: "" },
  // optional: track contact status (not required)
  status: { type: String, enum: ["new", "contacted"], default: "new" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('emailLead', leadSchema);
