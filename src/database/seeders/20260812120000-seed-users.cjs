'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface) {
    const password = await bcrypt.hash('mypassword123', 10);

    const users = [
      { username: 'buyer1', email: 'buyer1@example.com', password, role: 'buyer' },
      { username: 'buyer2', email: 'buyer2@example.com', password, role: 'buyer' },
      { username: 'buyer3', email: 'buyer3@example.com', password, role: 'buyer' },
      { username: 'buyer4', email: 'buyer4@example.com', password, role: 'buyer' },
      { username: 'buyer5', email: 'buyer5@example.com', password, role: 'buyer' },
      { username: 'seller1', email: 'seller1@example.com', password, role: 'seller' },
      { username: 'seller2', email: 'seller2@example.com', password, role: 'seller' },
    ].map((user) => ({
      id: randomUUID(),
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkDelete('Users', {
      username: users.map((user) => user.username),
    }, {});

    await queryInterface.bulkInsert('Users', users, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {
      username: ['buyer1', 'buyer2', 'buyer3', 'buyer4', 'buyer5', 'seller1', 'seller2'],
    }, {});
  },
};
