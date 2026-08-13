import { purchaseProduct } from "./order.service.js";

export const purchase = async (req, res, next) => {
  try {
    const productId = req.body.productId;
    const buyerId = req.user.id;

    const { order } = await purchaseProduct(productId, buyerId);

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};