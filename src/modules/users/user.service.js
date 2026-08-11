import User from './user.model.js';
import { toSafeUser } from '../../shared/utils/format-response.js';

const updateUserProfile = async (userId, { username }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error(404, 'User not found');
  }

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser && existingUser.id !== userId) {
    throw new Error(409, 'Username already taken');
  }

  user.username = username;
  await user.save();
  return toSafeUser(user);
};

export { updateUserProfile };