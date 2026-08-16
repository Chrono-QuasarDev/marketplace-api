import Order from './order.model.js';
import Product from '../products/products.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import sequelize from '../../config/db.js';
import { validateId } from '../../shared/validators/id.validator.js';
import { assertValidTransition } from '../../shared/utils/orderStatus.util.js';

export const purchaseProduct = async (productId, buyerId) => {
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

export const getOrderHistory = async (buyerId) => {
  if (!validateId(buyerId)) {
    throw new ApiError(400, 'Invalid buyer id');
  }

  const orders = await Order.findAll({ 
    where: { buyerId },
    include: [Product],
    order: [['createdAt', 'DESC']]
  });
  if (!orders) {
    throw new ApiError(404, 'No orders found for this buyer');
  }
  return orders;
};

export const getOrderByIdService = async (id, userId, userRole) => {
  if (!validateId(id)) {
    throw new ApiError(400, 'Invalid order id');
  }

  const order = await Order.findByPk(id, { include: [Product] });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const isOwner = order.buyerId === userId;
  const isSeller = order.Product.sellerId === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isSeller && !isAdmin) {
    throw new ApiError(403, 'Unauthorized to access this order');
  }
  return order;
}


export const updateOrderStatus = async (orderId, newStatus, requestingUserId, requestingUserRole) => {
  if (requestingUserRole !== 'admin' && requestingUserRole !== 'seller' && requestingUserRole !== 'buyer') {
    throw new ApiError(400, 'Unauthorized to update order status');
  }

  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertValidTransition(order.status, newStatus);

  if (newStatus === 'cancelled' && order.status === 'pending') {
    const product = await Product.findByPk(order.productId);
    if (product) {
      product.availability = true;
      await product.save();
    }
  }

  order.status = newStatus;
  await order.save();

  return order;
}