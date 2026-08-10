import User from '../users/user.model.js';
import bcrypt from 'bcrypt';
import { toSafeUser } from '../../shared/utils/format-response.js';
import { ApiError } from '../../shared/errors/ApiError.js';

const SALT_ROUNDS = 10;

export async function registerUser({ username, email, password }) {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({ username, email, password: hashedPassword });
  const safeUser = toSafeUser(user);

  return { user: safeUser };
}