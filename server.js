// server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import connectDb from './config/mongodb.js';
import sendMailRoute from './routes/sendMailRoute.js';

const app = express();
const port = process.env.PORT || 4000;

connectDb();

app.use(cors());
app.use(express.json());

// mount routes BEFORE starting server
app.use('/api/send-mail', sendMailRoute);

// create HTTP server and attach socket.io
const httpServer = http.createServer(app);

const io = new IOServer(httpServer, {
  cors: { origin: '*' }, // tighten for production
});

// store io on app so controllers can access it
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// start server using httpServer
httpServer.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
