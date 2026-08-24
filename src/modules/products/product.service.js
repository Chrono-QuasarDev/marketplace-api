import Products from './products.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { validateId } from '../../shared/validators/id.validator.js';

const createProductInDb = async (productData) => {
  const product = await Products.create({
    ...productData,
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
  if (!validateId(id)) {
    throw new ApiError(400, 'Invalid product id');
  }

  const product = await Products.findByPk(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

const updateProductByIdFromDb = async (id, sellerId, productData) => {
  if (!validateId(id)) {
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
  if (!validateId(id)) {
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