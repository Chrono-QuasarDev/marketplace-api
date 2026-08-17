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

  // Check if user has purchased the product
  const order = await Order.findOne({
    where: { buyerId: userId, productId },
    include: [{ model: Product }]
  });

  if (!order) {
    throw new ApiError(403, "You can only review products you have purchased");
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