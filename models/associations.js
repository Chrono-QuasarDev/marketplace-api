import User from './user.model.js';
import Product from './products.model.js';
import Order from './order.model.js';
import OrderItem from './order-item.model.js';
import Review from './review.model.js';


User.hasMany(Product, { foreignKey: 'sellerId' });
Product.belongsTo(User, { foreignKey: 'sellerId' });

User.hasMany(Order, { foreignKey: 'buyerId' });
Order.belongsTo(User, { foreignKey: 'buyerId' });

Order.belongsToMany(Product, { through: OrderItem, foreignKey: 'orderId' });
Product.belongsToMany(Order, { through: OrderItem, foreignKey: 'productId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });