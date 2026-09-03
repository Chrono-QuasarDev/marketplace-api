import { ApiError } from "../../shared/errors/ApiError.js";
import User from "../users/user.model.js";
import Product from "../products/products.model.js";
import { Op } from "sequelize";

export const getUsers = async (q, limit, offset) => {
  const where = {};

  if (q && q.trim() !== '') {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } }
    ]
  }

  const { rows, count } = await User.findAndCountAll({
    attributes: { exclude: ['password'] },
    where,
    limit,
    offset
  });
  return { rows, count };
}

export const getUserInfo = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [Product],
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export const removeUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, 'User not found');

  user.destroy();
}