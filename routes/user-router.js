const express = require('express');
const User = require('../model/user-schema');
const redisClient = require("../config/redisClient");
const ValidationUser = require('../middlewares/userValidation');
const ValidationUserUpdate = require('../middlewares/userUpdateValidation');
const bcrypt = require('bcrypt');
const router = express.Router();



// create a new User
router.post('/create',ValidationUser,async (req,res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: "User already Exists" });
        }

        const hashedPass = await bcrypt.hash(req.body.password,10);
        const user = await User.create({
            ...req.body, 
            password: hashedPass 
        });
        const userResponse = user.toObject ? user.toObject() : user.get({ plain: true });
        delete userResponse.password;
        res.status(201).json({message:"User Created Successfully",data: userResponse});
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// get all users
router.get('/',async (req,res) => {
    try {
        const cacheKey = 'users:all';
        const cachedUsers = await redisClient.get(cacheKey);
        if(cachedUsers){
            return res.status(200).json(JSON.parse(cachedUsers));
        }
        const users = await User.find({}).lean();
        if(users.length==0){
            return res.status(404).json({error:"No User found !!"});
        }
        await redisClient.set(cacheKey, JSON.stringify(users), { EX: 300 });
        res.status(200).json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
});


// get a user by Id

router.get('/:id',async (req,res) => {
    try {
        const {id} = req.params;
        const cacheKey = `user:${id}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        const user = await User.findById(id);
        if(!user){
            return res.status(404).json({error: " No such User found !!"});
        }
        await redisClient.set(cacheKey,JSON.stringify(user),{EX:3600});
        res.status(200).json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.put('/:id',ValidationUserUpdate,async (req,res) => {
    try {
        const {id} = req.params;
        const user = await User.findByIdAndUpdate(id,req.body,{ returnDocument: 'after' });
        if (!user) return res.status(404).json({ error: "Not found" });
        const userResponse = user.toObject();
        delete userResponse.password;

        //  Evict Caches to keep data 
        await redisClient.del(`user:${id}`);
        await redisClient.del('users:all');
        res.status(200).json({message:"User updated Successfully",data:userResponse});

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
})


router.delete('/:id',async (req,res) => {
    try {
        const {id} = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ error: "Not found" });
        await redisClient.del(`user:${id}`);
        await redisClient.del('users:all');
        res.status(200).json({message: " User Deleted Successfully"});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
})







module.exports = router;  