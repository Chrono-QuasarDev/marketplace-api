import { ApiError } from '../errors/ApiError.js';

const VALID_PRODUCT_FIELDS = ['title', 'description', 'price', 'category', 'images', 'availability'];

const sanitizeProductPayload = (productData, { requireAllFields = false } = {}) => {
  const safeData = {};

  for (const field of VALID_PRODUCT_FIELDS) {
    if (productData[field] !== undefined) {
      safeData[field] = productData[field];
    }
  }

  if (requireAllFields) {
    const required = ['title', 'description', 'price', 'category', 'images', 'availability'];
    const missing = required.filter(field => safeData[field] === undefined || safeData[field] === null);
    if (missing.length) {
      throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
    }
  }

  if (safeData.images !== undefined && (!Array.isArray(safeData.images) || safeData.images.length === 0)) {
    throw new ApiError(400, 'Images must be a non-empty array');
  }

  if (safeData.price !== undefined && (typeof safeData.price !== 'number' || safeData.price <= 0)) {
    throw new ApiError(400, 'Price must be a positive number');
  }

  if (safeData.availability !== undefined && typeof safeData.availability !== 'boolean') {
    throw new ApiError(400, 'Availability must be a boolean value');
  }

  return safeData;
};

export { VALID_PRODUCT_FIELDS, sanitizeProductPayload };
