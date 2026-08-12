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

export { createProductInDb };