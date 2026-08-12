import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../../app.js';
import sequelize from '../../../config/db.js';
import User from '../../users/user.model.js';
import { createAccessToken } from '../../../shared/utils/generate-token.js';

let sellerToken;
let buyerToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const sellerPassword = await bcrypt.hash('password123', 10);
  const buyerPassword = await bcrypt.hash('password123', 10);

  const seller = await User.create({
    username: 'selleruser',
    email: 'seller@example.com',
    password: sellerPassword,
    role: 'seller',
  });

  const buyer = await User.create({
    username: 'buyeruser',
    email: 'buyer@example.com',
    password: buyerPassword,
    role: 'buyer',
  });

  sellerToken = createAccessToken(seller);
  buyerToken = createAccessToken(buyer);
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/products', () => {
  it('should create a product when the user is a seller', async () => {
    const payload = {
      title: 'Gaming Laptop',
      description: 'A high-performance laptop for gaming and work.',
      price: 1299.99,
      category: 'electronics',
      images: ['image-1.jpg', 'image-2.jpg'],
      availability: true,
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      images: payload.images,
      availability: payload.availability,
    });
    expect(Number(res.body.price)).toBeCloseTo(payload.price, 2);
  });

  it('should reject a product request from a buyer', async () => {
    const payload = {
      title: 'Second Product',
      description: 'This product should not be accepted for buyers.',
      price: 250,
      category: 'home',
      images: ['image-3.jpg'],
      availability: true,
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(payload);

    expect(res.statusCode).toBe(403);
  });
});
