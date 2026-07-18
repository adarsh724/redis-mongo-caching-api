const express = require("express");
const redisClient = require("../config/redisClient");
const Product = require("../model/product-schema");
const requireTokenShield = require('../middlewares/tokenShield');
const requireAdmin = require('../middlewares/requireAdmin');
const router = express.Router();


// routes/products.js
router.post('/products', requireTokenShield,requireAdmin,async (req, res) => {
  try {
    const { name, description, category, price, stock } = req.body;

    // basic presence check — required fields per the schema
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'name, category, and price are required' });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock
    });

    const keysToDelete = [];
for await (const key of redisClient.scanIterator({ MATCH: 'products:*' })) {
  if (Array.isArray(key)) {
    keysToDelete.push(...key);
  } else {
    keysToDelete.push(key);
  }
}

if (keysToDelete.length > 0) {
  await redisClient.del(keysToDelete);
}
 
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get("/products/:id", requireTokenShield,async (req, res) => {
  const { id } = req.params;
  const cacheKey = `product:${id}`;
  try {
    // 1. Check cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    // if cache misses check DB
    // .lean() on the Mongoose query gives you a plain JS object instead of a full Mongoose document — faster to serialize with JSON.stringify.
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: "Not found" });

    // Storing in cache memory with an expiry time
    await redisClient.set(cacheKey, JSON.stringify(product), { EX: 3600 });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.put("/products/:id",requireTokenShield, requireAdmin,async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Product.findByIdAndUpdate(id, req.body, { returnDocument: 'after' }).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });

    // Invalidate the cache for this product
    await redisClient.del(`product:${id}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete('/products/:id',requireTokenShield, requireAdmin,async (req, res) => {
  const { id } = req.params;

  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });

  // clear the single-item cache
  await redisClient.del(`product:${id}`);

  // clear any cached list results too
  const keysToDelete = [];
  for await (const key of redisClient.scanIterator({ MATCH: 'products:*' })) {
    if (Array.isArray(key)) {
      keysToDelete.push(...key);
    } else {
      keysToDelete.push(key);
    }
  }
  if (keysToDelete.length > 0) {
    await redisClient.del(keysToDelete);
  }

  res.status(204).send();
});

// router.get("/products",requireTokenShield, async (req, res) => {
//   try {
//     const { category = "all", page = 1, limit = 20 } = req.query;
//     const cacheKey = `products:${category}:page:${page}:limit:${limit}`;
//     const cached = await redisClient.get(cacheKey);
//     if (cached) return res.json(JSON.parse(cached));

//     const query = category !== "all" ? { category } : {};
//     const products = await Product.find(query)
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .lean();

//     await redisClient.set(cacheKey, JSON.stringify(products), { EX: 300 }); // shorter TTL for lists
//     res.json(products);
//   } catch (error) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong" });
//   } 
// }); 

router.get('/products', requireTokenShield, async (req, res) => {
    const { category = 'all', page = 1, limit = 20, search = '' } = req.query;
    const cacheKey = `products:${category}:page:${page}:limit:${limit}:search:${search.toLowerCase()}`;

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));

        const query = {};
        if (category !== 'all') query.category = category;
        if (search.trim()) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        await redisClient.set(cacheKey, JSON.stringify(products), { EX: 300 });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;