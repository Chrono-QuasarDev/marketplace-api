import sequelize from './src/config/db.js';
import './src/database/associations.js';
import app from './src/app.js'

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    app.listen(3000, () => { console.log('Server is running on port 3000'); });
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();