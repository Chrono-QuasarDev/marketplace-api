import { ApiError } from '../errors/ApiError.js';

const validateProfileUpdateInput = ({ username }) => {
  if (!username) {
    throw new ApiError(400, 'Username is required');
  }
};

export { validateProfileUpdateInput };
