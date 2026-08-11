import jwt from 'jsonwebtoken';
import { configDotenv } from "dotenv";
import { ApiError } from "../errors/ApiError.js";

configDotenv();

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      throw new ApiError(401, 'Invalid token.');
    }
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};