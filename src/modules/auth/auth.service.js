import bcrypt from 'bcrypt';
import User from '../users/user.model.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { toSafeUser } from '../../shared/utils/format-response.js';
import { createAccessToken } from '../../shared/utils/generate-token.js';

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

export async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const safeUser = toSafeUser(user);
  const token = createAccessToken(safeUser);
  return { user: safeUser, token };
}