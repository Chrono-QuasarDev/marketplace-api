import jwt from 'jsonwebtoken';
import { configDotenv } from 'dotenv';

configDotenv();
const EXPIRES_IN = process.env.EXPIRES_IN;
const JWT_SECRET = process.env.JWT_SECRET;

export function createAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}