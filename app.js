const express = require('express');
require('dotenv').config();

const redisClient = require('./config/redisClient');
const productRoute = require('./routes/product-router');
const userRoute = require('./routes/user-router');
const connectDB = require('./config/mongoDbSetup');
const { connect } = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');



const app = express();
connectDB();

app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*', // tighten this once you have a real frontend
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json()); 
 
app.use('/api',productRoute);
app.use('/api/users',userRoute);

app.use(errorHandler);

module.exports=app; 