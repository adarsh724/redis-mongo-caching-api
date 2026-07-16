// seedProducts.js
// Run with: node seedProducts.js
// Inserts 100 sample products into MongoDB using your existing Product schema.

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./model/product-schema'); // adjust path to match your project structure

const categories = {
  electronics: [
    ['Wireless Mouse', 'Ergonomic 2.4GHz wireless mouse with adjustable DPI'],
    ['Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches'],
    ['USB-C Hub', '7-in-1 USB-C hub with HDMI and SD card reader'],
    ['Bluetooth Headphones', 'Over-ear noise-cancelling Bluetooth headphones'],
    ['Portable SSD 1TB', 'Compact external SSD with USB 3.2 support'],
    ['Smartwatch', 'Fitness tracking smartwatch with heart rate monitor'],
    ['Webcam 1080p', 'Full HD webcam with built-in microphone'],
    ['Power Bank 20000mAh', 'Fast-charging portable power bank'],
    ['Laptop Stand', 'Adjustable aluminum laptop stand'],
    ['Wireless Charger', '15W fast wireless charging pad'],
    ['Bluetooth Speaker', 'Portable waterproof Bluetooth speaker'],
    ['Gaming Mouse Pad', 'Extended RGB gaming mouse pad'],
    ['HDMI Cable 2m', 'High-speed HDMI 2.1 cable'],
    ['Phone Tripod', 'Flexible tripod stand for smartphones'],
    ['Ring Light', '10-inch LED ring light with tripod stand']
  ],
  clothing: [
    ['Cotton T-Shirt', 'Breathable 100% cotton crew-neck t-shirt'],
    ['Denim Jacket', 'Classic slim-fit denim jacket'],
    ['Running Shoes', 'Lightweight cushioned running shoes'],
    ['Wool Sweater', 'Soft merino wool pullover sweater'],
    ['Formal Shirt', 'Slim-fit formal cotton shirt'],
    ['Cargo Pants', 'Relaxed-fit cargo pants with multiple pockets'],
    ['Baseball Cap', 'Adjustable cotton baseball cap'],
    ['Leather Belt', 'Genuine leather belt with metal buckle'],
    ['Hooded Sweatshirt', 'Fleece-lined pullover hoodie'],
    ['Ankle Socks (3-pack)', 'Breathable cotton-blend ankle socks'],
    ['Chino Shorts', 'Casual cotton chino shorts'],
    ['Rain Jacket', 'Waterproof lightweight rain jacket'],
    ['Track Pants', 'Slim-fit joggers with elastic waistband'],
    ['Polo Shirt', 'Classic-fit cotton pique polo'],
    ['Winter Gloves', 'Insulated touchscreen-compatible gloves']
  ],
  books: [
    ['Atomic Habits', 'Bestselling guide to building better habits'],
    ['The Pragmatic Programmer', 'Classic software engineering handbook'],
    ['Clean Code', 'A handbook of agile software craftsmanship'],
    ['Sapiens', 'A brief history of humankind'],
    ['The Lean Startup', 'Guide to building successful startups'],
    ['Deep Work', 'Rules for focused success in a distracted world'],
    ['Design Patterns', 'Elements of reusable object-oriented software'],
    ['Thinking, Fast and Slow', 'Exploration of human decision-making'],
    ['The Pomodoro Technique', 'Time management method guide'],
    ['You Don\'t Know JS', 'Deep dive into JavaScript fundamentals']
  ],
  home: [
    ['Ceramic Coffee Mug', '350ml microwave-safe ceramic mug'],
    ['Non-Stick Frying Pan', '28cm non-stick aluminum frying pan'],
    ['LED Desk Lamp', 'Dimmable LED lamp with USB charging port'],
    ['Cotton Bedsheet Set', 'Queen-size 100% cotton bedsheet set'],
    ['Air Purifier', 'HEPA filter air purifier for medium rooms'],
    ['Electric Kettle', '1.7L stainless steel electric kettle'],
    ['Storage Organizer Bins', 'Set of 3 stackable storage bins'],
    ['Wall Clock', 'Minimalist silent wall clock'],
    ['Throw Blanket', 'Soft fleece throw blanket'],
    ['Kitchen Knife Set', '6-piece stainless steel knife set']
  ],
  sports: [
    ['Yoga Mat', 'Non-slip 6mm thick yoga mat'],
    ['Resistance Bands Set', '5-piece resistance band set with handles'],
    ['Adjustable Dumbbells', 'Pair of adjustable dumbbells, 2-20kg'],
    ['Football', 'Size 5 match-quality football'],
    ['Skipping Rope', 'Adjustable speed skipping rope'],
    ['Water Bottle 1L', 'Insulated stainless steel water bottle'],
    ['Cycling Helmet', 'Lightweight ventilated cycling helmet'],
    ['Badminton Racket Set', 'Pair of rackets with 3 shuttlecocks'],
    ['Gym Gloves', 'Padded weightlifting gym gloves'],
    ['Foam Roller', 'High-density muscle recovery foam roller']
  ],
  beauty: [
    ['Vitamin C Serum', 'Brightening facial serum with vitamin C'],
    ['Moisturizing Cream', 'Daily hydrating face cream'],
    ['Sunscreen SPF 50', 'Broad-spectrum lightweight sunscreen'],
    ['Hair Dryer', 'Compact 1800W ionic hair dryer'],
    ['Electric Toothbrush', 'Rechargeable sonic electric toothbrush'],
    ['Lip Balm Set', 'Set of 3 nourishing lip balms'],
    ['Facial Cleanser', 'Gentle foaming facial cleanser'],
    ['Makeup Brush Set', '12-piece professional makeup brush set'],
    ['Perfume 100ml', 'Long-lasting eau de parfum'],
    ['Hair Straightener', 'Ceramic plate hair straightener']
  ],
  toys: [
    ['Building Blocks Set', '500-piece creative building block set'],
    ['Remote Control Car', 'High-speed RC car with rechargeable battery'],
    ['Puzzle 1000 Pieces', 'Scenic landscape jigsaw puzzle'],
    ['Plush Teddy Bear', 'Soft 12-inch plush teddy bear'],
    ['Board Game', 'Family strategy board game for 2-6 players'],
    ['Action Figure', 'Collectible articulated action figure'],
    ['Drawing Tablet for Kids', 'LCD writing tablet for children'],
    ['Toy Drone', 'Beginner-friendly mini quadcopter drone']
  ],
  stationery: [
    ['Notebook Set', 'Pack of 3 ruled A5 notebooks'],
    ['Gel Pens (10-pack)', 'Smooth-writing assorted color gel pens'],
    ['Desk Organizer', 'Multi-compartment desk organizer'],
    ['Sticky Notes', 'Set of 6 sticky note pads'],
    ['Mechanical Pencil Set', '0.5mm mechanical pencils with refills'],
    ['Whiteboard Markers', 'Pack of 8 dry-erase markers'],
    ['Backpack', 'Water-resistant laptop backpack']
  ]
};

function randomPrice(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomStock() {
  return Math.floor(Math.random() * 200);
}

function buildProducts() {
  const products = [];
  const categoryNames = Object.keys(categories);

  categoryNames.forEach((category) => {
    categories[category].forEach(([name, description]) => {
      products.push({
        name,
        description,
        category,
        price: randomPrice(9.99, 499.99),
        stock: randomStock()
      });
    });
  });

  // Fill up to exactly 100 by cycling through categories with slight name variations
  let i = 0;
  while (products.length < 100) {
    const category = categoryNames[i % categoryNames.length];
    const base = categories[category][i % categories[category].length];
    products.push({
      name: `${base[0]} (V${Math.floor(i / categoryNames.length) + 2})`,
      description: base[1],
      category,
      price: randomPrice(9.99, 499.99),
      stock: randomStock()
    });
    i++;
  }

  return products.slice(0, 100);
} 

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    const products = buildProducts();

    await Product.deleteMany({}); // optional: clears existing products first
    const inserted = await Product.insertMany(products);

    console.log(`Inserted ${inserted.length} products successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();