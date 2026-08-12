import { registerUser, loginUser } from '../auth/auth.service.js';
import { validateSignupInput, validateLoginInput } from '../../shared/validators/auth.validator.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    validateSignupInput({ username, email, password });

    const { user } = await registerUser({ username, email, password });
    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    validateLoginInput({ email, password });

    const { user, token } = await loginUser({ email, password });
    return res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};