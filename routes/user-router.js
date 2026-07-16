const express = require("express");
const User = require("../model/user-schema");
const redisClient = require("../config/redisClient");
const ValidationUser = require("../middlewares/userValidation");
const ValidationUserUpdate = require("../middlewares/userUpdateValidation");
const requireTokenShield = require("../middlewares/tokenShield");
const accessOwnData = require("../middlewares/isOwnAccess");
const requireAdmin = require("../middlewares/requireAdmin");
const tokenBucketMiddleware = require("../middlewares/tokenBucketLimiter");
const cacheAsync = require("../utils/cacheAsync");
const AppError = require("../utils/AppError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

// create a new User
router.post( 
  "/create",
  tokenBucketMiddleware({
    capacity: 3,
    refillRatePerSecond: 1 / 1200, // 1 token every 20 min -> ~3 signups per hour per IP
    keyFn: (req) => `signup:${req.ip}`,
  }),
  ValidationUser,
  cacheAsync(async (req, res) => {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      throw new AppError("User already Exists", 400);
    }

    const hashedPass = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      ...req.body,
      password: hashedPass,
    });
    const userResponse = user.toObject
      ? user.toObject()
      : user.get({ plain: true });
    delete userResponse.password;

    await redisClient.del("users:all");
    res
      .status(201)
      .json({ message: "User Created Successfully", data: userResponse });
  }),
);

// get all users
router.get("/", requireTokenShield, requireAdmin, cacheAsync(async (req, res) => {
    const cacheKey = "users:all";
    const cachedUsers = await redisClient.get(cacheKey);
    if (cachedUsers) {
      return res.status(200).json(JSON.parse(cachedUsers));
    }
    const users = await User.find({}).lean();
    if (users.length == 0) {
      throw new AppError("No User Found", 404);
    }
    await redisClient.set(cacheKey, JSON.stringify(users), { EX: 300 });
    res.status(200).json(users);
   
}));

// get a user by Id

router.get("/:id", requireTokenShield, accessOwnData, cacheAsync(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `user:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    const user = await User.findById(id);
    if (!user) {
      throw new AppError("No User Found", 404);
    }
    await redisClient.set(cacheKey, JSON.stringify(user), { EX: 3600 });
    res.status(200).json(user);
  
}));

router.put(
  "/:id",
  requireTokenShield,
  accessOwnData,
  ValidationUserUpdate,
  cacheAsync(async (req, res) => {
    
      const { id } = req.params;

      if ("password" in req.body) {
        throw new AppError("Password Cannot be Updated through this route !!", 400);
      }

      const user = await User.findByIdAndUpdate(id, req.body, {
        returnDocument: "after",
        runValidators: true,
      });
      if (!user) throw new AppError("No User Found", 404);

      const userResponse = user.toObject();
      delete userResponse.password;

      await redisClient.del(`user:${id}`);
      await redisClient.del("users:all");
      res
        .status(200)
        .json({ message: "User updated Successfully", data: userResponse });
  },
));

router.delete("/:id", requireTokenShield, accessOwnData, cacheAsync(async (req, res) => {
  
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new AppError("No User Found", 404);
    await redisClient.del(`user:${id}`);
    await redisClient.del("users:all");
    res.status(200).json({ message: " User Deleted Successfully" });
  
}));

router.post(
  "/login",
  tokenBucketMiddleware({
    capacity: 5,
    refillRatePerSecond: 1 / 12, // 1 token every 12 sec -> 5 per minute steady state
    keyFn: (req) => `login:${req.body.email || req.ip}`,
  }),
  cacheAsync(async (req, res) => {
    
      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError("Invalid Username or Password !!", 401);
      }
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        throw new AppError("Invalid Credentials Passed !!", 401);
      }
      const isMatching = await bcrypt.compare(password, user.password);
      if (!isMatching) {
        throw new AppError("Invalid Credentials Passed !!", 401);
      }
      const userpayload = {
        username: user.name,
        userId: user._id,
        role: user.role,
      };
      const token = jwt.sign(userpayload, process.env.MY_SECRET_KEY, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_SECRET_KEY,
        { expiresIn: "7d" },
      );

      await redisClient.set(`refresh:${user._id}`, refreshToken, {
        EX: 7 * 24 * 60 * 60,
      });
      res.status(200).json({
        success: true,
        accessToken: token,
        refreshToken: refreshToken,
      });
    
  }
));

router.post("/logout", requireTokenShield, cacheAsync(async (req, res) => {
  
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);
    const now = Math.floor(Date.now() / 1000);
    const remainingTTL = decoded.exp - now;

    if (remainingTTL > 0) {
      await redisClient.set(`blacklist:${token}`, "true", { EX: remainingTTL });
    }
    await redisClient.del(`refresh:${decoded.userId}`);
    res.status(200).json({ message: "Logged out successfully" });
  
}));

router.post("/refresh", cacheAsync(async (req, res) => {
  
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError("Refresh Token Expired !!", 401);
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    } catch (error) {
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }
    const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      throw new AppError("Refresh Token has been Revoked !!", 403);
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError("User Not Found  !!", 404);
    }

    const userpayload = {
      username: user.name,
      userId: user._id,
      role: user.role,
    };
    const newAccessToken = jwt.sign(userpayload, process.env.MY_SECRET_KEY, {
      expiresIn: "15m",
    });

    res.status(200).json({ accessToken: newAccessToken });
  
}));

module.exports = router;
