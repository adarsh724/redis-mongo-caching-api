const express = require('express');
const PORT = process.env.PORT;
require('dotenv').config();
const redisClient = require('./config/redisClient');
const productRoute = require('./routes/product-router');
const connectDB = require('./config/mongoDbSetup');
const { connect } = require('mongoose');

const app = express();
connectDB();

app.use(express.json());

app.use('/api',productRoute);
app.listen(PORT,()=>{
    console.log("Server is Running Successfully");
})
