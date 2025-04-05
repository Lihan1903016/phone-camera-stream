const express = require("express");
const http = require("http");
const nodemailer = require("nodemailer");
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));
app.use(express.json());

app.post("/send-email", async (req, res) => {
  const { email } = req.body;
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "10m" });
  const confirmURL = `https://b0xjtsxm-3000.asse.devtunnels.ms/confirm.html?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Camera Stream App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Check Once",
    html: `<p>Use this to enter: <a href="${confirmURL}">${confirmURL}</a></p>`,
  });

  res.send({ message: "Confirmation sent." });
});

app.get("/verify-token", (req, res) => {
  const { token } = req.query;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.redirect("/stream.html");
  } catch {
    res.status(403).send("Token invalid or expired.");
  }
});

io.on('connection', socket => {
    console.log('User connected:', socket.id);
  
    socket.on('offer', (data) => {
      socket.broadcast.emit('offer', data);
    });
  
    socket.on('answer', (data) => {
      socket.broadcast.emit('answer', data);
    });
  
    socket.on('candidate', (data) => {
      socket.broadcast.emit('candidate', data);
    });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
