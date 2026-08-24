import { registerUser, loginUser } from '../auth/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const { user } = await registerUser({ username, email, password });

    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginUser({ email, password });

    return res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};