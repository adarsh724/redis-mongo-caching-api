const express = require('express');

const accessOwnData =  (req,res,next) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Access Denied: User identity unverified." });
    }

    const requestedResourceId = req.params.id;
    const authenticatedUserId = req.user.userId;

    if (authenticatedUserId !== requestedResourceId) {
        return res.status(403).json({ 
            error: "Access Forbidden: You are not authorized to view or modify this account." 
        });
    }
    // 3. If they match, let them through!
    next();
};

module.exports = accessOwnData;