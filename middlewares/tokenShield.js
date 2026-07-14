const jwt = require('jsonwebtoken');

const requireTokenShield = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    
    // 1. 🔹 Safely check if the header even exists first
    if (!authHeader) {
        return res.status(401).json({ error: "Access Denied: Missing authentication token badge." });
    }

    // 2. 🔹 Safely extract the token after ensuring the header exists
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Access Denied: Token malformed." });
    }

    try {
        const isVerified = jwt.verify(token, process.env.MY_SECRET_KEY);
        req.user = isVerified;
        next();
    } catch (error) {
        // Now this ONLY fires if the token is truly expired or fake!
        console.error("JWT Verification Failed Details:", error.message);
        return res.status(403).json({ error: "Access Forbidden: Token is expired or altered." });
    } 
};

module.exports = requireTokenShield;