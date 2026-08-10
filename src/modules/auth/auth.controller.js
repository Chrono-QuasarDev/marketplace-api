import { ApiError } from '../../shared/errors/ApiError.js';
import { registerUser, loginUser } from '../auth/auth.service.js';

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      throw new ApiError(400, 'All fields are required');
    }
  
    const { user } = await registerUser({ username, email, password });
    return res.status(201).json({  user });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const { user, token } = await loginUser({ email, password });
    return res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
}