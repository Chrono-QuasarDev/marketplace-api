import { purchaseProduct, getOrderByIdService, getOrderHistory, updateOrderStatus } from "./order.service.js";

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

    const orders = await getOrderHistory(id);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role: userRole } = req.user;

    const order = await getOrderByIdService(id, userId, userRole);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}

export const patchOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { id: userId, role: userRole } = req.user;

    const order = await updateOrderStatus(id, status, userId, userRole);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}