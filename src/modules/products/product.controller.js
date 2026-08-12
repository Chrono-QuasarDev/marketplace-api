import { createProductInDb } from './product.service.js'

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

export { createProduct }