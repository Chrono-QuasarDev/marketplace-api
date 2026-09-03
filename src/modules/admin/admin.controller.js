import { getUsers, getUserInfo, removeUser } from "./admin.service.js";
import { paramSchema, searchSchema } from "../../shared/validators/param.validator.js";

export const users = async (req, res, next) => {
  try {
    const { page, q, size } = searchSchema.parse(req.query);

    let limit = size;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const { rows, count } = await getUsers(q, limit, offset);
    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export const userInfo = async (req, res, next) => {
  try {
    const { id } = paramSchema.parse(req.params);
    const user = await getUserInfo(id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await removeUser(id);
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    next(error);
  }
}