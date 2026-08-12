import { createProductInDb, getProductsFromDb } from './product.service.js';

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
    const sortBy = req.query.sortBy || 'createdAt';
    const orderBy = req.query.orderBy || 'desc';

    // Calculate limit and offset
    const limit = size;
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

export { createProduct, getProducts }