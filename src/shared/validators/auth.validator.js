import { ApiError } from '../errors/ApiError.js';

const validateSignupInput = ({ username, email, password }) => {
  if (!username || !email || !password) {
    throw new ApiError(400, 'All fields are required');
  }
};

const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
};

export { validateSignupInput, validateLoginInput };
