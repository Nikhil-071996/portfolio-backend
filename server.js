import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDb from './config/mongodb.js';
import sendMailRoute from './routes/sendMailRoute.js'


const app = express();
const port = process.env.PORT || 4000

connectDb();

app.use(cors())
app.use(express.json());

app.use('/api/send-mail', sendMailRoute)

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})
