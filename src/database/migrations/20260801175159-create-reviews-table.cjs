'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Reviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        allowNull: false,
        onDelete: 'RESTRICT'
      },
      productId: {
        type: Sequelize.UUID,
        references: {
          model: 'Products',
          key: 'id'
        },
        allowNull: false,
        onDelete: 'RESTRICT'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    // enforce rating between 1 and 5 at the DB level
    await queryInterface.sequelize.query(`ALTER TABLE "Reviews" ADD CONSTRAINT "reviews_rating_check" CHECK (rating >= 1 AND rating <= 5);`);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Reviews');
  }
};
