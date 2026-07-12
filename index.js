const express = require('express');
require('dotenv').config();
const PORT = process.env.PORT || 8000;
const redisClient = require('./config/redisClient');
const productRoute = require('./routes/product-router');
const userRoute = require('./routes/user-router');
const connectDB = require('./config/mongoDbSetup');
const { connect } = require('mongoose');

const app = express();
connectDB();

app.use(express.json()); 
 
app.use('/api',productRoute);
app.use('/api/users',userRoute);


app.listen(PORT,()=>{
    console.log("Server is Running Successfully");
})
