'use strict';

const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface) {
    const sellers = await queryInterface.sequelize.query(
      `SELECT id, username FROM "Users" WHERE role = 'seller' AND username IN (:sellerNames)`,
      {
        replacements: { sellerNames: ['seller1', 'seller2'] },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (!sellers.length) {
      return;
    }

    const sellerIds = sellers.map((seller) => seller.id);
    const categories = [
      'electronics',
      'home',
      'fashion',
      'sports',
      'books',
      'beauty',
      'office',
      'grocery',
      'toys',
      'garden',
    ];

    const products = [];

    sellers.forEach((seller) => {
      for (let i = 1; i <= 20; i += 1) {
        const category = categories[(i - 1) % categories.length];
        const price = Number((Math.random() * 400 + 25).toFixed(2));

        products.push({
          id: randomUUID(),
          sellerId: seller.id,
          title: `${seller.username} ${category} product ${i}`,
          description: `High-quality ${category} item ${i} from ${seller.username}. Designed for everyday use and reliable performance.`,
          price,
          category,
          images: [
            `https://example.com/images/${seller.username}-${category}-${i}-1.jpg`,
            `https://example.com/images/${seller.username}-${category}-${i}-2.jpg`,
          ],
          availability: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    await queryInterface.bulkDelete('Products', {
      sellerId: sellerIds,
    }, {});

    await queryInterface.bulkInsert('Products', products, {});
  },

  async down(queryInterface) {
    const sellers = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'seller' AND username IN (:sellerNames)`,
      {
        replacements: { sellerNames: ['seller1', 'seller2'] },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const sellerIds = sellers.map((seller) => seller.id);

    if (sellerIds.length) {
      await queryInterface.bulkDelete('Products', {
        sellerId: sellerIds,
      }, {});
    }
  },
};
