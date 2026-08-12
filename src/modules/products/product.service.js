import Products from './products.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { sanitizeProductPayload } from '../../shared/validators/product.validator.js';

const createProductInDb = async (productData) => {
  const safeData = sanitizeProductPayload(productData, { requireAllFields: true });

  const product = await Products.create({
    ...safeData,
    sellerId: productData.sellerId,
  });

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

const updateProductByIdFromDb = async (id, sellerId, productData) => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid product id');
  }

  const product = await Products.findByPk(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.sellerId !== sellerId) {
    throw new ApiError(403, 'You are not the owner of this product');
  }

  const safeData = sanitizeProductPayload(productData);
  if (Object.keys(safeData).length === 0) {
    return product;
  }

  await product.update(safeData);
  return product;
};

const deleteProductByIdFromDb = async (id, sellerId) => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid product id');
  }

  const product = await Products.findByPk(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.sellerId !== sellerId) {
    throw new ApiError(403, 'You are not the owner of this product');
  }

  await product.destroy();
};

export { createProductInDb, getProductsFromDb, getProductByIdFromDb, updateProductByIdFromDb, deleteProductByIdFromDb };