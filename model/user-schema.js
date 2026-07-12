
const mongoose= require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true
    },
    password:{
        type: String, 
        required:true,
        select:false  
    },
    phoneNumber: {
    type: String,
    unique:true,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number']
    },
    age:{
        type:Number,
        required:true
    },
    role:{
        type:String,
        enum:['admin','manager','staff','viewer'],
        default:'staff'
    },
    isActive:{
        type: Boolean,
        default:true
    }
},{
    timestamps:true
});

const User  = mongoose.model('User',userSchema);

module.exports=User;