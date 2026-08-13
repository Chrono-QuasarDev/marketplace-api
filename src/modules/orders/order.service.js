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

  // Confirm product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Begin transaction
  const transaction = await sequelize.transaction();
  try {
    const [affectedRows] = await Product.update(
      { availability: false },
      { where: { id: productId, availability: true }, transaction }
    );

    if (affectedRows === 0) {
      throw new ApiError(409, 'Product not available for purchase');
    }

    // Create order (single-product order stores productId and priceAtPurchase)
    const order = await Order.create(
      { buyerId, productId, priceAtPurchase: product.price, status: 'completed' },
      { transaction }
    );

    await transaction.commit();

    return { order };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
