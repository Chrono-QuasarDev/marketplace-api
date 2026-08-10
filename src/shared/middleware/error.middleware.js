import { ApiError } from '../errors/ApiError.js';

export async function errorHandler(err, req, res, next) {
  console.error(err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  } else {
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}