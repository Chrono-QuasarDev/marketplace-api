import { createReview, updateReview, deleteReview, getProductReviews } from './review.service.js';

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

export const editReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await updateReview({ userId, reviewId: id, rating, comment });
    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
}

export const removeReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;
    const { id } = req.params;

    const result = await deleteReview({ userId, reviewId: id, role });
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, sortBy, orderBy, page, size } = req.query;

    const hasQueryParams = Object.keys(req.query).length > 0;
    const review = await getProductReviews({
      productId: id,
      rating,
      sortBy,
      orderBy,
      page,
      size,
    });

    if (!hasQueryParams) {
      return res.status(200).json(review.data);
    }

    return res.status(200).json(review);
  } catch (error) {
    next(error);
  }
};