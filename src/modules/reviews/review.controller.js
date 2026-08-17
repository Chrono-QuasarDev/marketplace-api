import { createReview } from './review.service.js';

export const addReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    const review = await createReview({ userId, productId, rating, comment });
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};