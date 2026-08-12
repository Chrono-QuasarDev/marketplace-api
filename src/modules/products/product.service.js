import Products from './products.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';

const createProductInDb = async (productData) => {
  const required = ['title', 'description', 'price', 'category', 'images', 'availability'];
  const missing = required.filter(field => productData[field] === undefined || productData[field] === null);
  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
  }

  if (!Array.isArray(productData.images) || productData.images.length === 0) {
    throw new ApiError(400, 'Images must be a non-empty array');
  }

  if (typeof productData.price !== 'number' || productData.price <= 0) {
    throw new ApiError(400, 'Price must be a positive number');
  }

  if (typeof productData.availability !== 'boolean') {
    throw new ApiError(400, 'Availability must be a boolean value');
  }

  const product = await Products.create(productData);
  return product;
};

const getProductsFromDb = async (params) => {
  const { limit, offset, sortBy, orderBy } = params;
  const { count, rows } = await Products.findAndCountAll({
    limit,
    offset,
    order: [[sortBy, orderBy]]
  });
  return { count, rows };
};

const getProductByIdFromDb = async (id) => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid product id');
  }

  const product = await Products.findByPk(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

export { createProductInDb, getProductsFromDb, getProductByIdFromDb };