const Joi = require('joi');

const userValidator = Joi.object({
    name: Joi.string().required().trim(),
    email : Joi.string().email().required().lowercase().trim(),
    password: Joi.string().alphanum().min(6).max(18).required(),
    phoneNumber :Joi.string().pattern(/^\d{10}$/).required()
        .messages({ 'string.pattern.base': 'Phone number must be exactly 10 digits.' }),
    age:Joi.number().required(),
    role:Joi.string().valid('admin', 'manager', 'staff', 'viewer').default('staff'),
    isActive: Joi.boolean().default(true)
});

const userUpdateValidator = userValidator.fork(
    ['name', 'email', 'password', 'phoneNumber', 'age'], 
    (schema) => schema.optional()
);
module.exports= {userValidator,userUpdateValidator};