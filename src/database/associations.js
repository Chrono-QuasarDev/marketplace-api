import User from '../modules/users/user.model.js';
import Product from '../modules/products/products.model.js';
import Order from '../modules/orders/order.model.js';
import Review from '../modules/reviews/review.model.js';


User.hasMany(Product, { foreignKey: 'sellerId' });
Product.belongsTo(User, { foreignKey: 'sellerId' });

User.hasMany(Order, { foreignKey: 'buyerId' });
Order.belongsTo(User, { foreignKey: 'buyerId' });

Order.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Order, { foreignKey: 'productId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });