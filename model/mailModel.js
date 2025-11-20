import mongoose from "mongoose";


const leadSchema = new mongoose.Schema({
    name : { type : String, required: true },
    email : { type : String, required: true },
    message : { type : String }
})

export default mongoose.model('emailLead', leadSchema)