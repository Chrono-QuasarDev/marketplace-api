import User from './user.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { toSafeUser } from '../../shared/utils/format-response.js';

const updateUserProfile = async (userId, { username }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser && existingUser.id !== userId) {
    throw new ApiError(409, 'Username already taken');
  }

  user.username = username;
  await user.save();
  return toSafeUser(user);
};

export { updateUserProfile };