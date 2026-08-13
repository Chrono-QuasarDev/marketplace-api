import { purchaseProduct, getOrderByIdService, getOrdersService } from "./order.service.js";

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

export const getOrders = async (req, res, next) => {
  try {
    const { id } = req.user;
    const orders = await getOrdersService(id);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await getOrderByIdService(id);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}