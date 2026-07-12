const {userUpdateValidator} = require('../validators/user-validator');
const Joi = require('joi');

const ValidationUserUpdate = (req,res,next)=>{
    const {error,value} = userUpdateValidator.validate(req.body,{abortEarly:false});
    if(error){
        return res.status(400).json({ message: error.details[0].message });
    }
    req.body = value;
    next();
}

module.exports =ValidationUserUpdate ;