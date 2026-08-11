import User from './user.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { toSafeUser } from '../../shared/utils/format-response.js';

export const profile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json(toSafeUser(user));
  } catch (error) {
    next(error);
  }
};