import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../../app.js';
import sequelize from '../../../config/db.js';
import User from '../user.model.js';
import { createAccessToken } from '../../../shared/utils/generate-token.js';

let token;
let user;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const hashedPassword = await bcrypt.hash("password123", 10);

  user = await User.create({
    username: "originaluser",
    email: "test@example.com",
    password: hashedPassword,
    role: "buyer",
  });

  token = createAccessToken(user);
});

afterAll(async () => {
  await sequelize.close();
});

describe('PUT /api/users/profile', () => {
  it("should update the username successfully", async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "updateduser" });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.username).toBe('updateduser');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it("should return 400 if username is missing", async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/username is required/i);
  });

  it("should return 401 if no token is provided", async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ username: "noauthuser" });

    expect(res.statusCode).toBe(401);
  });

  it("should return 409 if username is already taken", async () => {
    await User.create({
      username: "takenname",
      email: "other@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "buyer",
    });

    const res = await request(app)
      .put('/api/users/profile')
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "takenname" });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already taken/i);
  });
});