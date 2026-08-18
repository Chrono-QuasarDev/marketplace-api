import sequelize from './src/config/db.js';
import './src/database/associations.js';
import app from './src/app.js'

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    app.listen(3000, () => { console.log('Server is at http://localhost:3000/api/products'); });
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();