import { DataTypes } from "sequelize";
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('buyer', 'seller', 'admin'),
    defaultValue: 'buyer',
    allowNull: false
  }
});

export default User;