import { createProductInDb, getProductsFromDb, getProductByIdFromDb, updateProductByIdFromDb, deleteProductByIdFromDb } from './product.service.js';

const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'title'];
const ALLOWED_ORDER = ['asc', 'desc'];

const createProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { title, description, price, category, images, availability } = req.body;
    const product = await createProductInDb({ sellerId, title, description, price, category, images, availability });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const orderBy = ALLOWED_ORDER.includes(req.query.orderBy) ? req.query.orderBy : 'desc';

    // Calculate limit and offset
    let limit = size;
    if (limit >= 100) limit = 100;
    const offset = (page - 1) * limit;

    const { count, rows } = await getProductsFromDb({ limit, offset, sortBy, orderBy });
    res.status(200).json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await getProductByIdFromDb(id);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const { title, description, price, category, images, availability } = req.body;
    const product = await updateProductByIdFromDb(id, sellerId, { title, description, price, category, images, availability });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    await deleteProductByIdFromDb(id, sellerId);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export { createProduct, getProducts, getProductById, updateProductById, deleteProductById }