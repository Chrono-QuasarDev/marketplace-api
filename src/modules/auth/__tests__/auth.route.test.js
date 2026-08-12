import request from 'supertest';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import app from '../../../app.js';
import sequelize from '../../../config/db.js';
import User from '../../users/user.model.js';

const testEmails = ['user@example.com', "attacker@example.com"];
const testUsernames = ['normaluser', 'attacker'];

beforeAll(async () => {
  await sequelize.sync();

  await User.destroy({
    where: {
      [Op.or]: [
        { username: { [Op.in]: testUsernames } },
        { email: { [Op.in]: testEmails } }
      ]
    }
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  await User.create({
    username: 'normaluser',
    email: 'user@example.com',
    password: hashedPassword,
    role: 'buyer',
  });
});

afterAll(async () => {
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

describe('Auth route bad-input and attack cases', () => {
  it('should reject signup when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'newuser', email: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/all fields are required/i);
  });

  it('should reject login attempts with SQL-injection-style email payloads', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: "user@example.com' OR '1'='1",
        password: 'password123',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('should reject login on invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrong-password',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});
