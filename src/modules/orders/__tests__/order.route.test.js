import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../../app.js';
import sequelize from '../../../config/db.js';
import User from '../../users/user.model.js';
import Product from '../../products/products.model.js';
import Order from '../order.model.js';
import { createAccessToken } from '../../../shared/utils/generate-token.js';

let sellerToken;
let buyerToken;
let secondBuyerToken;
let adminToken;
let sellerUser;
let buyerUser;
let secondBuyerUser;
let adminUser;

beforeAll(async () => {
  await sequelize.sync();

  const passwordHash = await bcrypt.hash('password123', 10);

  sellerUser = await User.create({
    username: 'order-seller',
    email: 'order-seller@example.com',
    password: passwordHash,
    role: 'seller',
  });

  buyerUser = await User.create({
    username: 'order-buyer',
    email: 'order-buyer@example.com',
    password: passwordHash,
    role: 'buyer',
  });

  secondBuyerUser = await User.create({
    username: 'order-buyer-2',
    email: 'order-buyer-2@example.com',
    password: passwordHash,
    role: 'buyer',
  });

  adminUser = await User.create({
    username: 'order-admin',
    email: 'order-admin@example.com',
    password: passwordHash,
    role: 'admin',
  });

  sellerToken = createAccessToken(sellerUser);
  buyerToken = createAccessToken(buyerUser);
  secondBuyerToken = createAccessToken(secondBuyerUser);
  adminToken = createAccessToken(adminUser);
});

afterAll(async () => {
  await Order.destroy({ where: {} });
  await Product.destroy({ where: {} });
  await User.destroy({ where: {} });
  await sequelize.close();
});

describe('POST /api/orders/purchase', () => {
  it('should create an order for an available product and mark it unavailable', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Laptop for Order Test',
      description: 'A valid product for order creation.',
      price: 899.99,
      category: 'electronics',
      images: ['laptop-1.jpg'],
      availability: true,
    });

    const res = await request(app)
      .post('/api/orders/purchase')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id });

    expect(res.statusCode).toBe(201);
    expect(res.body.order).toMatchObject({
      buyerId: buyerUser.id,
      productId: product.id,
      status: 'pending',
    });
    expect(Number(res.body.order.priceAtPurchase)).toBeCloseTo(899.99, 2);

    const updatedProduct = await Product.findByPk(product.id);
    expect(updatedProduct.availability).toBe(false);
  });

  it('should reject purchase when the product is unavailable', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Sold Product',
      description: 'Already sold product.',
      price: 120.0,
      category: 'home',
      images: ['sold.jpg'],
      availability: false,
    });

    const res = await request(app)
      .post('/api/orders/purchase')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product.id });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/not available for purchase/i);
  });

  it('should reject purchase when a user tries to buy their own listing', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Seller Own Listing',
      description: 'Seller should not buy own item.',
      price: 50.0,
      category: 'misc',
      images: ['own.jpg'],
      availability: true,
    });

    const res = await request(app)
      .post('/api/orders/purchase')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ productId: product.id });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/cannot purchase their own product/i);
  });
});

describe('GET /api/orders', () => {
  it('should return all orders for the authenticated buyer', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Order History Product',
      description: 'Used to test order retrieval.',
      price: 220.0,
      category: 'books',
      images: ['history.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 220.0,
      status: 'pending',
    });

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.some((entry) => entry.id === order.id)).toBe(true);
  });
});

describe('GET /api/orders/:id', () => {
  it('should return an order for the buyer who owns it', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Single Order Lookup',
      description: 'Used to test single order lookup.',
      price: 75.0,
      category: 'tools',
      images: ['lookup.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 75.0,
      status: 'pending',
    });

    const res = await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.order.id).toBe(order.id);
    expect(res.body.order.buyerId).toBe(buyerUser.id);
  });

  it('should deny access to another buyer', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Private Order',
      description: 'Another buyer should not access this order.',
      price: 320.0,
      category: 'furniture',
      images: ['private.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 320.0,
      status: 'pending',
    });

    const res = await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${secondBuyerToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  it('should allow the seller of the product to view the order', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Seller View Product',
      description: 'Seller should be able to view its order.',
      price: 145.5,
      category: 'sports',
      images: ['seller-view.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 145.5,
      status: 'pending',
    });

    const res = await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.order.id).toBe(order.id);
    expect(res.body.order.Product.sellerId).toBe(sellerUser.id);
  });
});

describe('PATCH /api/orders/:id', () => {
  it('should allow a seller to update order status to processing', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Processing Product',
      description: 'Seller updates status to processing.',
      price: 410.0,
      category: 'appliances',
      images: ['processing.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 410.0,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'processing' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('processing');
  });

  it('should deny invalid status transitions', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Invalid Transition Product',
      description: 'An invalid transition should fail.',
      price: 600.0,
      category: 'gaming',
      images: ['invalid.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 600.0,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid transition/i);
  });

  it('should allow cancellation from pending and restore availability', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Cancellation Product',
      description: 'Cancel order and restore product availability.',
      price: 99.0,
      category: 'decor',
      images: ['cancel.jpg'],
      availability: false,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 99.0,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('cancelled');

    const updatedProduct = await Product.findByPk(product.id);
    expect(updatedProduct.availability).toBe(true);
  });

  it('should reject a buyer patch request', async () => {
    const product = await Product.create({
      sellerId: sellerUser.id,
      title: 'Buyer Patch Product',
      description: 'A buyer should not be able to patch order status.',
      price: 80.0,
      category: 'office',
      images: ['buyer-patch.jpg'],
      availability: true,
    });

    const order = await Order.create({
      buyerId: buyerUser.id,
      productId: product.id,
      priceAtPurchase: 80.0,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'processing' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });
});
