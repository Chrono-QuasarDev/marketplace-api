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
let otherSellerToken;
let detailProductId;

const testUsernames = ['selleruser', 'buyeruser', 'otherseller'];
const testEmails = ['seller@example.com', 'buyer@example.com', 'other-seller@example.com'];
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

  const otherSeller = await User.create({
    username: 'otherseller',
    email: 'other-seller@example.com',
    password: sellerPassword,
    role: 'seller',
  });

  sellerToken = createAccessToken(seller);
  buyerToken = createAccessToken(buyer);
  otherSellerToken = createAccessToken(otherSeller);
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

describe('PUT /api/products/:id', () => {
  it('should update a product when the seller owns it', async () => {
    const payload = {
      title: 'Update Owner Product',
      description: 'This product should be updated by its owner.',
      price: 499.99,
      category: 'electronics',
      images: ['update-owner-before.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Updated Laptop',
        price: 549.99,
        availability: false,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.title).toBe('Updated Laptop');
    expect(Number(res.body.price)).toBeCloseTo(549.99, 2);
    expect(res.body.availability).toBe(false);
  });

  it('should reject updates when another seller tries to update the product', async () => {
    const payload = {
      title: 'Update Other Seller Product',
      description: 'This product belongs to the original seller.',
      price: 399,
      category: 'home',
      images: ['update-other-seller.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({ title: 'Hacked title' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/not the owner|not authorized|forbidden/i);
  });

  it('should return 404 when the product does not exist', async () => {
    const randomUuid = '22222222-2222-4222-8222-222222222222';

    const res = await request(app)
      .put(`/api/products/${randomUuid}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ title: 'Ghost update' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/product not found/i);
  });

  it('should return 400 for invalid product id format', async () => {
    const res = await request(app)
      .put('/api/products/123')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ title: 'bad id' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid product id/i);
  });

  it('should require auth token before updating a product', async () => {
    const payload = {
      title: 'Update Without Token',
      description: 'This request should fail without auth.',
      price: 250,
      category: 'misc',
      images: ['update-no-auth.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .send({ title: 'No token' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/token|unauthorized|access denied/i);
  });

  it('should reject updates when the requester is a buyer', async () => {
    const payload = {
      title: 'Buyer Update Attempt',
      description: 'A buyer should not be allowed to update products.',
      price: 179.99,
      category: 'office',
      images: ['buyer-update-attempt.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ title: 'Buyer update' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it('should ignore attempts to change id or sellerId in the request body', async () => {
    const payload = {
      title: 'Whitelist Check',
      description: 'This product should keep its original seller information.',
      price: 320,
      category: 'office',
      images: ['whitelist-check.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const sellerIdBefore = createRes.body.sellerId;

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        id: '33333333-3333-4333-8333-333333333333',
        sellerId: '44444444-4444-4444-8444-444444444444',
        title: 'Updated title after whitelist test',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated title after whitelist test');
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.sellerId).toBe(sellerIdBefore);
  });

  it.each([
    ['negative price', { price: -50 }, /price must be a positive number/i],
    ['non-boolean availability', { availability: 'yes' }, /availability must be a boolean value/i],
    ['empty images array', { images: [] }, /images must be a non-empty array/i],
  ])('should reject invalid update value for %s', async (_label, updateBody, expectedError) => {
    const payload = {
      title: 'Invalid Update Value Product',
      description: 'This product should fail validation on update.',
      price: 125,
      category: 'misc',
      images: ['invalid-update.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(updateBody);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(expectedError);
  });

  it('should allow partial updates and only change the provided field', async () => {
    const payload = {
      title: 'Partial Update Product',
      description: 'This product should keep most fields intact.',
      price: 250,
      category: 'books',
      images: ['partial-update-before.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .put(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ price: 199.99 });

    expect(res.statusCode).toBe(200);
    expect(Number(res.body.price)).toBeCloseTo(199.99, 2);
    expect(res.body.title).toBe(payload.title);
    expect(res.body.description).toBe(payload.description);
    expect(res.body.category).toBe(payload.category);
    expect(res.body.images).toEqual(payload.images);
    expect(res.body.availability).toBe(payload.availability);
  });
});

describe('DELETE /api/products/:id', () => {
  it('should delete a product when the seller owns it', async () => {
    const payload = {
      title: 'Delete Owner Product',
      description: 'This product should be deleted by its owner.',
      price: 399.99,
      category: 'electronics',
      images: ['delete-owner.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .delete(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ message: 'Product deleted successfully' });
  });

  it('should reject deletion when another seller tries to delete the product', async () => {
    const payload = {
      title: 'Delete Other Seller Product',
      description: 'This product belongs to the original seller.',
      price: 249.5,
      category: 'home',
      images: ['delete-other-seller.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .delete(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${otherSellerToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/not the owner|not authorized/i);
  });

  it('should return 404 when the product does not exist', async () => {
    const randomUuid = '11111111-1111-4111-8111-111111111111';

    const res = await request(app)
      .delete(`/api/products/${randomUuid}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/product not found/i);
  });

  it('should return 400 for invalid product id format', async () => {
    const res = await request(app)
      .delete('/api/products/123')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid product id/i);
  });

  it('should require auth token before deleting a product', async () => {
    const payload = {
      title: 'Delete Without Token',
      description: 'This request should fail without auth.',
      price: 149,
      category: 'misc',
      images: ['delete-no-auth.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .delete(`/api/products/${createRes.body.id}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/token|unauthorized|access denied/i);
  });

  it('should reject deletion when the requester is a buyer', async () => {
    const payload = {
      title: 'Buyer Delete Attempt',
      description: 'A buyer should not be allowed to delete products.',
      price: 179.99,
      category: 'office',
      images: ['buyer-delete-attempt.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .delete(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it('should return 404 on a second delete of the same product', async () => {
    const payload = {
      title: 'Delete Twice Check',
      description: 'Delete the same product twice to verify cleanup.',
      price: 899,
      category: 'electronics',
      images: ['delete-twice.jpg'],
      availability: true,
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);

    const firstDelete = await request(app)
      .delete(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(firstDelete.statusCode).toBe(200);

    const secondDelete = await request(app)
      .delete(`/api/products/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(secondDelete.statusCode).toBe(404);
    expect(secondDelete.body.error).toMatch(/product not found/i);
  });
});
