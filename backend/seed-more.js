require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const categories = {
  "Vegetables": [
    { name: "Aloo (Potatoes)", imgKey: "Potatoes" },
    { name: "Pyaaz (Onions)", imgKey: "Onions" },
    { name: "Gajar (Carrots)", imgKey: "Carrots" },
    { name: "Patta Gobi (Cabbage)", imgKey: "Cabbage" },
    { name: "Baingan (Eggplant)", imgKey: "Aubergine" },
    { name: "Kheera (Cucumber)", imgKey: "Cucumber" },
    { name: "Shatavari (Asparagus)", imgKey: "Asparagus" },
    { name: "Hari Phool Gobi (Broccoli)", imgKey: "Broccoli" },
    { name: "Ajmoda (Celery)", imgKey: "Celery" },
    { name: "Lahsun (Garlic)", imgKey: "Garlic" }
  ],
  "Fruits": [
    { name: "Seb (Apples)", imgKey: "Apples" },
    { name: "Santra (Orange)", imgKey: "Orange" },
    { name: "Kela (Banana)", imgKey: "Banana" },
    { name: "Strawberry", imgKey: "Strawberries" },
    { name: "Raspberry", imgKey: "Raspberries" },
    { name: "Blueberry", imgKey: "Blueberries" },
    { name: "Aadoo (Peaches)", imgKey: "Peaches" },
    { name: "Nashpati (Pears)", imgKey: "Pears" },
    { name: "Cherry", imgKey: "Cherry" },
    { name: "Khumani (Apricot)", imgKey: "Apricot" }
  ],
  "Leafy Vegetables": [
    { name: "Palak (Spinach)", imgKey: "Spinach" },
    { name: "Kale (Karam Saag)", imgKey: "Kale" },
    { name: "Salad Patta (Lettuce)", imgKey: "Lettuce" },
    { name: "Rocket Leaves", imgKey: "Rocket" },
    { name: "Tulsi (Basil)", imgKey: "Basil" },
    { name: "Dhania Patta (Coriander)", imgKey: "Coriander" },
    { name: "Pudina (Mint)", imgKey: "Mint" },
    { name: "Parsley", imgKey: "Parsley" },
    { name: "Thyme", imgKey: "Thyme" },
    { name: "Rosemary", imgKey: "Rosemary" }
  ],
  "Dairy": [
    { name: "Doodh (Milk)", imgKey: "Milk" },
    { name: "Makhan (Butter)", imgKey: "Butter" },
    { name: "Cheese", imgKey: "Cheese" },
    { name: "Malai (Cream)", imgKey: "Cream" },
    { name: "Dahi (Yogurt)", imgKey: "Yogurt" },
    { name: "Cheddar Cheese", imgKey: "Cheddar Cheese" },
    { name: "Parmesan Cheese", imgKey: "Parmesan" },
    { name: "Feta Cheese", imgKey: "Feta" },
    { name: "Mascarpone", imgKey: "Mascarpone" },
    { name: "Ricotta Cheese", imgKey: "Ricotta" }
  ],
  "Grains": [
    { name: "Chawal (Rice)", imgKey: "Rice" },
    { name: "Bhura Chawal (Brown Rice)", imgKey: "Brown Rice" },
    { name: "Basmati Chawal", imgKey: "Basmati Rice" },
    { name: "Jaei (Oats)", imgKey: "Oats" },
    { name: "Rolled Oats", imgKey: "Rolled Oats" },
    { name: "Atta (Flour)", imgKey: "Flour" },
    { name: "Macaroni", imgKey: "Macaroni" },
    { name: "Spaghetti", imgKey: "Spaghetti" },
    { name: "Couscous", imgKey: "Couscous" },
    { name: "Bread", imgKey: "Bread" }
  ],
  "Organic Products": [
    { name: "Shahad (Honey)", imgKey: "Honey" },
    { name: "Haldi (Turmeric)", imgKey: "Turmeric" },
    { name: "Badam (Almonds)", imgKey: "Almonds" },
    { name: "Akhrot (Walnuts)", imgKey: "Walnuts" },
    { name: "Kali Mirch (Black Pepper)", imgKey: "Black Pepper" },
    { name: "Elaichi (Cardamom)", imgKey: "Cardamom" },
    { name: "Peanut Butter", imgKey: "Peanut Butter" },
    { name: "Dalchini (Cinnamon)", imgKey: "Cinnamon" },
    { name: "Adrak (Ginger)", imgKey: "Ginger" },
    { name: "Jaiphal (Nutmeg)", imgKey: "Nutmeg" }
  ]
};

const units = {
  "Vegetables": "kg",
  "Fruits": "kg",
  "Leafy Vegetables": "bunch",
  "Dairy": "kg",
  "Grains": "kg",
  "Organic Products": "pack"
};

async function seedMore() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/farm-to-home');
    console.log('Connected to DB for seeding');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    let farmer = await User.findOne({ email: 'farmer@demo.com' });
    if (!farmer) {
      farmer = new User({
        name: 'Demo Farmer',
        email: 'farmer@demo.com',
        phone: '1234567890',
        password: 'password123',
        role: 'farmer',
        address: '123 Farm Lane, Agriculture City',
        farmName: 'Green Acres Demo Farm',
        verified: true
      });
      await farmer.save();
    }

    const allProducts = [];

    for (const [category, items] of Object.entries(categories)) {
      items.forEach((item, idx) => {
        const price = Math.floor(Math.random() * 200) + 20; 
        allProducts.push({
          name: item.name,
          category: category,
          description: `Fresh, locally sourced ${item.name}.`,
          price: price,
          discountPrice: price - (price * 0.1), 
          stock: Math.floor(Math.random() * 100) + 10,
          unit: units[category] || 'kg',
          images: [{ url: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(item.imgKey)}.png`, publicId: `demo_${category}_${idx}` }],
          organic: category === "Organic Products" || Math.random() > 0.7,
          seasonal: Math.random() > 0.5,
          farmer: farmer._id,
          rating: (Math.random() * 2 + 3).toFixed(1),
          numReviews: Math.floor(Math.random() * 50) + 1,
        });
      });
    }

    await Product.insertMany(allProducts);
    console.log(`Inserted ${allProducts.length} Demo Products with Indian names!`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedMore();
