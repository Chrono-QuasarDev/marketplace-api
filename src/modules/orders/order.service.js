import Order from './order.model.js';
import Product from '../products/products.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import sequelize from '../../config/db.js';
import { validateId } from '../../shared/validators/id.validator.js';

export const purchaseProduct = async (productId, buyerId) => {
  // Validate product ID
  if (!validateId(productId)) {
    throw new ApiError(400, 'Invalid product id');
  }
  // Begin transaction
  const result = await sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(productId, {
      transaction, lock: transaction.LOCK.UPDATE
    });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (!product.availability) {
      throw new ApiError(409, 'Product not available for purchase');
    }

    if (product.sellerId === buyerId) {
      throw new ApiError(400, 'Buyer cannot purchase their own product');
    }

    let priceAtPurchase = product.price;

    product.availability = false;
    await product.save({ transaction });

    // Create order (single-product order stores productId and priceAtPurchase)
    const order = await Order.create(
      { 
        buyerId, 
        productId: product.id, 
        priceAtPurchase, 
        status: 'pending' },
      { transaction }
    );

    return { order };
  });
  
  return result;
};

export const getOrdersService = async (buyerId) => {
  if (!validateId(buyerId)) {
    throw new ApiError(400, 'Invalid buyer id');
  }

  const orders = await Order.findAll({ where: { buyerId } });
  if (!orders) {
    throw new ApiError(404, 'No orders found for this buyer');
  }
  return orders;
};

export const getOrderByIdService = async (id) => {
  if (!validateId(id)) {
    throw new ApiError(400, 'Invalid order id');
  }
  
  const order = await Order.findByPk(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
}