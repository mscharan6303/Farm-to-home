const https = require('https');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const Product = require('../models/Product');

const AP_MARKET_URL = 'https://market.todaypricerates.com/Andhra-Pradesh-vegetables-price';

const mappings = [
  { match: ['aloo', 'potato'], key: 'potato' },
  { match: ['pyaaz', 'onion'], key: 'onion big' },
  { match: ['tamatar', 'tomato'], key: 'tomato' },
  { match: ['gobi', 'cauliflower'], key: 'cauliflower' },
  { match: ['bhindi', 'okra'], key: 'okra (ladies\' finger)' },
  { match: ['baingan', 'eggplant', 'brinjal'], key: 'eggplant (brinjal or aubergine)' },
  { match: ['gajar', 'carrot'], key: 'carrot' },
  { match: ['shimla mirch', 'capsicum', 'bell pepper'], key: 'bell pepper (capsicum)' },
  { match: ['palak', 'spinach'], key: 'spinach' },
  { match: ['dhaniya', 'coriander'], key: 'coriander leaves (cilantro)' },
  { match: ['pudina', 'mint'], key: 'mint leaves' },
  { match: ['cabbage'], key: 'cabbage' },
  { match: ['aam', 'mango'], key: 'mango' },
  { match: ['kela', 'banana'], key: 'plantain (raw banana)' },
  { match: ['corn'], key: 'corn' },
  { match: ['cucumber'], key: 'cucumber' },
  { match: ['garlic'], key: 'garlic' },
  { match: ['ginger'], key: 'ginger' },
  { match: ['lemon'], key: 'lemon (lime)' },
  { match: ['mushroom'], key: 'mushroom' },
  { match: ['radish'], key: 'radish (daikon)' },
  { match: ['sweet potato'], key: 'sweet potato' },
  { match: ['beetroot'], key: 'beetroot' },
  { match: ['green peas', 'matar'], key: 'green peas' }
];

function fetchAPVegetablePrices() {
  return new Promise((resolve, reject) => {
    https.get(AP_MARKET_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const rows = [...data.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
          const priceMap = {};
          rows.forEach(r => {
            const name = r[1].replace(/<[^>]+>/g, '').trim();
            const unit = r[2].replace(/<[^>]+>/g, '').trim();
            const mandiText = r[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            const retailText = r[4].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

            const mandiMatch = mandiText.match(/₹\s*(\d+)/);
            const retailMatch = retailText.match(/₹\s*(\d+)(?:\s*-\s*(\d+))?/);

            const mandiPrice = mandiMatch ? parseInt(mandiMatch[1]) : 0;
            const retailMin = retailMatch ? parseInt(retailMatch[1]) : mandiPrice;
            const retailMax = retailMatch && retailMatch[2] ? parseInt(retailMatch[2]) : retailMin;
            const avgRetail = Math.round((retailMin + retailMax) / 2);

            priceMap[name.toLowerCase()] = {
              name,
              unit,
              mandiPrice,
              retailMin,
              retailMax,
              retailPrice: avgRetail
            };
          });
          resolve(priceMap);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

const runMarketUpdate = async () => {
  try {
    console.log('🌾 Fetching daily vegetable prices from Andhra Pradesh Mandi Market (https://market.todaypricerates.com/Andhra-Pradesh-vegetables-price)...');
    const priceMap = await fetchAPVegetablePrices();
    const totalAPItems = Object.keys(priceMap).length;
    console.log(`✅ Successfully fetched ${totalAPItems} daily vegetable market prices from Andhra Pradesh Mandi.`);

    // 1. Update frontend mockData file
    let mockUpdated = 0;
    const mockDataPath = path.join(__dirname, '../../frontend/src/services/mockData.js');
    if (fs.existsSync(mockDataPath)) {
      try {
        let content = fs.readFileSync(mockDataPath, 'utf8');
        const match = content.match(/export const mockProducts = (\[[\s\S]*?\]);/);
        if (match) {
          let mockList = JSON.parse(match[1]);
          mockList = mockList.map(prod => {
            const lname = prod.name.toLowerCase();
            let matchedRate = null;
            for (const m of mappings) {
              if (m.match.some(term => lname.includes(term))) {
                if (priceMap[m.key]) {
                  matchedRate = priceMap[m.key];
                  break;
                }
              }
            }
            if (matchedRate) {
              mockUpdated++;
              return {
                ...prod,
                price: matchedRate.retailPrice,
                discountPrice: matchedRate.mandiPrice,
                updatedAt: new Date().toISOString()
              };
            }
            return prod;
          });

          const newCode = content.replace(/export const mockProducts = \[[\s\S]*?\];/, `export const mockProducts = ${JSON.stringify(mockList, null, 2)};`);
          fs.writeFileSync(mockDataPath, newCode, 'utf8');
          console.log(`✅ Updated frontend mockData.js with ${mockUpdated} fresh AP Mandi market prices.`);
        }
      } catch (mockErr) {
        console.warn('Warning: Failed to rewrite mockData.js:', mockErr.message);
      }
    }

    // 2. Update MongoDB if database is connected
    let dbUpdated = 0;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const dbProducts = await Product.find({}).maxTimeMS(3000);
        for (let product of dbProducts) {
          const lname = product.name.toLowerCase();
          let matchedRate = null;
          for (const m of mappings) {
            if (m.match.some(term => lname.includes(term))) {
              if (priceMap[m.key]) {
                matchedRate = priceMap[m.key];
                break;
              }
            }
          }

          if (matchedRate) {
            product.price = matchedRate.retailPrice;
            product.discountPrice = matchedRate.mandiPrice;
            product.updatedAt = new Date();
            await product.save();
            dbUpdated++;
          }
        }
        console.log(`✅ Updated MongoDB database with ${dbUpdated} fresh AP Mandi market prices.`);
      }
    } catch (dbErr) {
      console.warn('MongoDB offline or query timed out, skipped DB update:', dbErr.message);
    }

    console.log(`🎉 Daily Price Sync Complete! AP Market Prices applied successfully.`);
    return { success: true, mockUpdated, dbUpdated, totalAPItems, syncedAt: new Date().toISOString() };
  } catch (error) {
    console.error('❌ Error updating market prices from AP Mandi:', error.message);
    throw error;
  }
};

const startMarketUpdater = () => {
  // Run every day at 00:00 (Midnight)
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Scheduled daily AP market price update starting...');
    runMarketUpdate().catch(err => console.error(err));
  });

  // Run on server startup after 5 seconds delay
  setTimeout(() => {
    console.log('🚀 Server startup: Running initial AP market price sync...');
    runMarketUpdate().catch(err => console.warn('Startup price sync failed:', err.message));
  }, 5000);
};

module.exports = { startMarketUpdater, runMarketUpdate, fetchAPVegetablePrices };
