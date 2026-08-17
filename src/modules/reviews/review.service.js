import Review from "./review.model.js";
import Order from "../orders/order.model.js";
import Product from "../products/products.model.js";
import User from "../users/user.model.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { validateId } from "../../shared/validators/id.validator.js";

export const createReview = async ({ userId, productId, rating, comment }) => {
  // Validate IDs
  if (!validateId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Invalid rating. Please provide a rating between 1 and 5.");
  }

  // Check if user has purchased the product and the order is actually delivered
  const order = await Order.findOne({
    where: { buyerId: userId, productId },
    include: [{ model: Product }]
  });

  if (!order) {
    throw new ApiError(403, "You can only review products you have purchased");
  }

  if (order.status !== 'delivered') {
    throw new ApiError(403, "You can only review products after the order has been delivered");
  }

  const existingReview = await Review.findOne({
    where: { userId, productId }
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  // Create the review
  const review = await Review.create({ userId, productId, rating, comment });
  return review;
};

export const updateReview = async ({ userId, reviewId, rating, comment }) => {
  // Validate IDs
  if (!validateId(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  // Get review from db
  const review = await Review.findByPk(reviewId);

  // Check if review exists
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check if user is the owner of the review
  if (review.userId !== userId) {
    throw new ApiError(403, "You can only edit your own reviews");
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new ApiError(400, "Invalid rating. Please provide a rating between 1 and 5.");
    }
    review.rating = rating;
  }

  if (comment !== undefined) {
    review.comment = comment;
  }

  // Save the updated review
  await review.save();
  return review;
}

export const deleteReview = async ({ userId, reviewId, role }) => {
  // Validate IDs
  if (!validateId(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  // Get review from db
  const review = await Review.findByPk(reviewId);

  // Check if review exists
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check if user is the owner of the review or an admin
  const isOwner = review.userId === userId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  // Delete the review
  await review.destroy();

  return true;
};

export const getProductReviews = async ({ productId, rating, sortBy = 'createdAt', orderBy = 'desc', page = 1, size = 10, }) => {
  // Validate product id
  if (!validateId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const allowedSortFields = ['createdAt', 'rating'];
  const allowedOrder = ['asc', 'desc'];

  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const safeOrderBy = allowedOrder.includes(orderBy) ? orderBy : 'desc';
  const safePage = Number(page) > 0 ? Number(page) : 1;
  let safeSize = Number(size) > 0 ? Number(size) : 10;
  if (safeSize >= 100) safeSize = 100;

  const where = { productId };
  if (rating !== undefined && rating !== null && rating !== '') {
    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new ApiError(400, 'Invalid rating filter');
    }
    where.rating = parsedRating;
  }

  const offset = (safePage - 1) * safeSize;

  const { count, rows } = await Review.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'username'] }],
    order: [[safeSortBy, safeOrderBy]],
    limit: safeSize,
    offset,
  });

  return {
    data: rows,
    meta: {
      page: safePage,
      limit: safeSize,
      totalItems: count,
      totalPages: Math.ceil(count / safeSize),
    },
  };
};