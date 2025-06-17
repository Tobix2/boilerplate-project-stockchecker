'use strict';

const crypto = require('crypto');

const stockLikes = {};

const anonymizeIp = (ip) => crypto.createHash('sha256').update(ip).digest('hex');

module.exports = function (app) {
  const stockPricesSim = {
    'GOOG': 786.90,
    'MSFT': 62.30,
    'AAPL': 310.12,
    'TSLA': 600.78,
  };

  app.route('/api/stock-prices')
    .get((req, res) => {
      let { stock, like } = req.query;
      if (!stock) {
        return res.status(400).json({ error: 'Stock parameter is required' });
      }

      const stocks = Array.isArray(stock) ? stock.map(s => s.toUpperCase()) : [stock.toUpperCase()];
      const ip = req.ip || req.connection.remoteAddress || '';
      const anonIp = anonymizeIp(ip);
      const results = [];

      stocks.forEach(stk => {
        if (!stockPricesSim[stk]) {
          results.push({ stock: stk, price: null, likes: 0 });
          return;
        }

        if (!stockLikes[stk]) stockLikes[stk] = new Set();

        if (like && like === 'true') {
          stockLikes[stk].add(anonIp);
        }

        const price = stockPricesSim[stk];
        const likesCount = stockLikes[stk].size;

        results.push({ stock: stk, price: Number(price.toFixed(2)), likes: likesCount });
      });

      if (results.length === 1) {
        return res.json({ stockData: results[0] });
      } else {
        const relLikes1 = results[0].likes - results[1].likes;
        const relLikes2 = results[1].likes - results[0].likes;

        return res.json({
          stockData: [
            { stock: results[0].stock, price: results[0].price, rel_likes: relLikes1 },
            { stock: results[1].stock, price: results[1].price, rel_likes: relLikes2 }
          ]
        });
      }
    });
};
