import { DataTypes } from "sequelize";
import sequelize from '../config/db.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered'),
    defaultValue: 'pending',
    allowNull: false
  }
});

export default Order;