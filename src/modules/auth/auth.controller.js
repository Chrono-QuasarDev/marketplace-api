import { registerUser } from '../auth/auth.service.js';
import { ApiError } from '../../shared/errors/ApiError.js';

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