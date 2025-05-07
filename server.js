require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();

mongoose.connect(process.env.MONGO_URL);
app.get('/', (req, res) => res.send('Hello from Docker!'));
app.listen(3000);