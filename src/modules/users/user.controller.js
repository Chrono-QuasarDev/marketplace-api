import User from './user.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { toSafeUser } from '../../shared/utils/format-response.js';
import { updateUserProfile } from './user.service.js';
import { validateProfileUpdateInput } from '../../shared/validators/user.validator.js';

const profile = async (req, res, next) => {
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

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;
    validateProfileUpdateInput({ username });

    const user = await updateUserProfile(userId, { username });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export { profile, updateProfile };