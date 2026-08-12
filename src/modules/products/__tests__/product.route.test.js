import request from 'supertest';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import app from '../../../app.js';
import sequelize from '../../../config/db.js';
import User from '../../users/user.model.js';
import Product from '../products.model.js';
import { createAccessToken } from '../../../shared/utils/generate-token.js';

let sellerToken;
let buyerToken;
let detailProductId;

const testUsernames = ['selleruser', 'buyeruser'];
const testEmails = ['seller@example.com', 'buyer@example.com'];
const testProductTitles = ['Gaming Laptop', 'Second Product', 'Product Detail Test'];

beforeAll(async () => {
  await sequelize.sync();

  const existingUsers = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.in]: testUsernames } },
        { email: { [Op.in]: testEmails } }
      ]
    }
  });

  if (existingUsers.length) {
    await Product.destroy({
      where: {
        sellerId: existingUsers.map(user => user.id)
      }
    });
  }

  await Product.destroy({
    where: {
      title: { [Op.in]: testProductTitles }
    }
  });

  await User.destroy({
    where: {
      [Op.or]: [
        { username: { [Op.in]: testUsernames } },
        { email: { [Op.in]: testEmails } }
      ]
    }
  });

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
  const existingUsers = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.in]: testUsernames } },
        { email: { [Op.in]: testEmails } }
      ]
    }
  });

  if (existingUsers.length) {
    await Product.destroy({
      where: {
        sellerId: existingUsers.map(user => user.id)
      }
    });
  }

  await Product.destroy({
    where: {
      title: { [Op.in]: testProductTitles }
    }
  });

  await User.destroy({
    where: {
      [Op.or]: [
        { username: { [Op.in]: testUsernames } },
        { email: { [Op.in]: testEmails } }
      ]
    }
  });

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

  it('should return 400 when required fields are missing', async () => {
    const payload = {
      title: 'Incomplete product',
      price: 100,
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/i);
  });

  it('should return 400 when payload fields are invalid', async () => {
    const payload = {
      title: 'Broken Product',
      description: 'Bad payload values',
      price: -10,
      category: 'fitness',
      images: [],
      availability: 'yes',
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/price must be a positive number|images must be a non-empty array|availability must be a boolean value/i);
  });

  it('should return 401 for an invalid token', async () => {
    const payload = {
      title: 'Invalid Token Test',
      description: 'Attempt with malformed token',
      price: 100,
      category: 'misc',
      images: ['image-4.jpg'],
      availability: true,
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer bad.token.value')
      .send(payload);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
  });

  it('should accept a product with an attacker-style title without crashing', async () => {
    const payload = {
      title: "Injection'); DROP TABLE Users;--",
      description: 'A product that looks malicious but should be treated as text.',
      price: 199.99,
      category: 'security',
      images: ['malicious.jpg'],
      availability: true,
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(payload.title);
  });

  it('should fetch a product by id', async () => {
    const payload = {
      title: 'Product Detail Test',
      description: 'A product created specifically for detail lookup.',
      price: 149.99,
      category: 'testing',
      images: ['detail-1.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);
    detailProductId = createRes.body.id;

    const res = await request(app)
      .get(`/api/products/${detailProductId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(detailProductId);
    expect(res.body.title).toBe(payload.title);
    expect(res.body.description).toBe(payload.description);
  });
});
