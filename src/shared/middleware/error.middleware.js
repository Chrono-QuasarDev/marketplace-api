import { ApiError } from '../errors/ApiError.js';

export const errorHandler = async (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Username already taken' });
  }

  console.error(err);
  
  return res.status(500).json({ error: 'An unexpected error occurred' });
  next(err);
}