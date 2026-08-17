import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../../app.js';
import sequelize from '../../../config/db.js';
import User from '../../users/user.model.js';
import Product from '../../products/products.model.js';
import Order from '../../orders/order.model.js';
import Review from '../review.model.js';
import { createAccessToken } from '../../../shared/utils/generate-token.js';

let sellerToken;
let buyerToken;
let secondBuyerToken;
let adminToken;
let sellerUser;
let buyerUser;
let secondBuyerUser;
let adminUser;

const createProductWithDeliveredOrder = async (overrides = {}) => {
  const product = await Product.create({
    sellerId: sellerUser.id,
    title: 'Reviewable Product',
    description: 'A product with a completed purchase.',
    price: 150.0,
    category: 'misc',
    images: ['reviewable.jpg'],
    availability: false,
    ...overrides,
  });

  const order = await Order.create({
    buyerId: buyerUser.id,
    productId: product.id,
    priceAtPurchase: product.price,
    status: 'delivered',
  });

  return { product, order };
};

beforeAll(async () => {
  await sequelize.sync();

  const passwordHash = await bcrypt.hash('password123', 10);

  sellerUser = await User.create({
    username: 'review-seller',
    email: 'review-seller@example.com',
    password: passwordHash,
    role: 'seller',
  });

  buyerUser = await User.create({
    username: 'review-buyer',
    email: 'review-buyer@example.com',
    password: passwordHash,
    role: 'buyer',
  });

  secondBuyerUser = await User.create({
    username: 'review-buyer-2',
    email: 'review-buyer-2@example.com',
    password: passwordHash,
    role: 'buyer',
  });

  adminUser = await User.create({
    username: 'review-admin',
    email: 'review-admin@example.com',
    password: passwordHash,
    role: 'admin',
  });

  sellerToken = createAccessToken(sellerUser);
  buyerToken = createAccessToken(buyerUser);
  secondBuyerToken = createAccessToken(secondBuyerUser);
  adminToken = createAccessToken(adminUser);
});

afterAll(async () => {
  await Review.destroy({ where: {} });
  await Order.destroy({ where: {} });
  await Product.destroy({ where: {} });
  await User.destroy({ where: {} });
  await sequelize.close();
});

describe('POST /api/reviews', () => {
  it('should create a review when the buyer has a delivered order for the product', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 5, comment: 'Great product, arrived fast.' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      userId: buyerUser.id,
      productId: product.id,
      rating: 5,
      comment: 'Great product, arrived fast.',
    });
  });

  it('should reject a review when the buyer never purchased the product', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Never Purchased Product',
      description: 'No order exists for this product.',
      price: 60.0,
      category: 'misc',
      images: ['never-purchased.jpg'],
      availability: true,
    });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 4 });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/purchased/i);
  });

  it('should reject a review when the purchase has not been delivered yet', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Pending Purchase Product',
      description: 'Order exists but is not delivered yet.',
      price: 90.0,
      category: 'misc',
      images: ['pending-purchase.jpg'],
      availability: false,
    });

    await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: product.price,
      status: 'pending',
    });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 4, comment: 'Not delivered yet.' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/delivered/i);
  });

  it('should reject a duplicate review for the same product by the same buyer', async () => {
    const { product } = await createProductWithDeliveredOrder();

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 5, comment: 'First review.' });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 2, comment: 'Second attempt.' });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already reviewed/i);
  });

  it('should reject a rating below 1', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 0 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject a rating above 5', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 6 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject an invalid product id', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: 'not-a-uuid', rating: 4 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject an unauthenticated request', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const res = await request(app)
      .post('/api/reviews')
      .send({ productId: product.id, rating: 4 });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/reviews/:id', () => {
  it('should return all reviews for a product', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 4, comment: 'Solid buy.' });

    const res = await request(app)
      .get(`/api/reviews/${product.id}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((entry) => entry.id === created.body.id)).toBe(true);
  });

  it('should support rating filtering, sorting, and pagination for reviews', async () => {
    const { product } = await createProductWithDeliveredOrder();

    await Order.create({
      buyerId: secondBuyerUser.id,
      productId: product.id,
      priceAtPurchase: product.price,
      status: 'delivered',
    });

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 3, comment: 'Average product.' });

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${secondBuyerToken}`)
      .send({ productId: product.id, rating: 5, comment: 'Excellent product.' });

    const res = await request(app)
      .get(`/api/reviews/${product.id}?rating=5&sortBy=rating&orderBy=desc&page=1&size=10`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].rating).toBe(5);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('should reject an invalid product id', async () => {
    const res = await request(app)
      .get('/api/reviews/not-a-uuid')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/reviews/:id', () => {
  it('should allow the owner to update their review', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 3, comment: 'It was okay.' });

    const res = await request(app)
      .put(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 5, comment: 'Actually, it grew on me.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Actually, it grew on me.');
  });

  it('should allow updating only the comment and keep the existing rating', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 4, comment: 'Original comment.' });

    const res = await request(app)
      .put(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ comment: 'Updated comment only.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.comment).toBe('Updated comment only.');
  });

  it('should reject an update from a non-owner', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 3, comment: 'Owned by buyerUser.' });

    const res = await request(app)
      .put(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${secondBuyerToken}`)
      .send({ rating: 1, comment: 'Trying to hijack this review.' });

    expect(res.statusCode).toBe(403);
  });

  it('should reject an invalid rating on update', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 3 });

    const res = await request(app)
      .put(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 7 });

    expect(res.statusCode).toBe(400);
  });

  it('should return 404 for a valid UUID that does not exist', async () => {
    const res = await request(app)
      .put('/api/reviews/11111111-1111-4111-8111-111111111111')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 4 });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/reviews/:id', () => {
  it('should allow the owner to delete their own review', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 3, comment: 'To be deleted by owner.' });

    const res = await request(app)
      .delete(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(200);

    const deleted = await Review.findByPk(created.body.id);
    expect(deleted).toBeNull();
  });

  it('should allow an admin to delete someone else\'s review', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 2, comment: 'To be deleted by admin.' });

    const res = await request(app)
      .delete(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    const deleted = await Review.findByPk(created.body.id);
    expect(deleted).toBeNull();
  });

  it('should reject deletion from a non-owner, non-admin', async () => {
    const { product } = await createProductWithDeliveredOrder();

    const created = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id, rating: 3, comment: 'Should not be deletable by others.' });

    const res = await request(app)
      .delete(`/api/reviews/${created.body.id}`)
      .set('Authorization', `Bearer ${secondBuyerToken}`);

    expect(res.statusCode).toBe(403);

    const stillExists = await Review.findByPk(created.body.id);
    expect(stillExists).not.toBeNull();
  });

  it('should return 404 when deleting a valid UUID that does not exist', async () => {
    const res = await request(app)
      .delete('/api/reviews/11111111-1111-4111-8111-111111111111')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(404);
  });
});
