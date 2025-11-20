import mongoose from "mongoose"


const connectDb = async () => {
    mongoose.connection.on('connected' , () => {
        console.log("Database Connected")
    })

    mongoose.connection.on('error', (err) => {
        console.error('Mongo DB Err' , err)
    })

    try{
        await mongoose.connect(process.env.MONGODB_URI)
    }catch(e){
        console.error("Failed to connect:" , e)
        process.exit(1);
    }
}

export default connectDb