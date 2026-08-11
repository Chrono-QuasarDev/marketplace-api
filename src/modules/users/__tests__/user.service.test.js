import { jest } from '@jest/globals';

const userModel = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
};

jest.unstable_mockModule('../user.model.js', () => ({ default: userModel }));

const { updateUserProfile } = await import('../user.service.js');

describe('updateUserProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw 404 if user is not found', async () => {
    userModel.findByPk.mockResolvedValue(null);

    await expect(
      updateUserProfile('non-existent-id', { username: 'newname' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 409 if username is already taken by another user', async () => {
    userModel.findByPk.mockResolvedValue({
      id: 'user-1',
      username: 'old',
      save: jest.fn(),
    });

    userModel.findOne.mockResolvedValue({
      id: 'user-2',
      username: 'takenname',
    });

    await expect(
      updateUserProfile('user-1', { username: 'takenname' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('should update username successfully', async () => {
    const mockSave = jest.fn();
    const mockUser = {
      id: "user-1",
      username: "old",
      email: "test@example.com",
      password: "hashed",
      save: mockSave,
      toJSON() {
        return {
          id: this.id,
          username: this.username,
          email: this.email,
          password: this.password,
        };
      },
    };

    userModel.findByPk.mockResolvedValue(mockUser);
    userModel.findOne.mockResolvedValue(null);

    const result = await updateUserProfile('user-1', { username: 'newname' });

    expect(mockUser.username).toBe("newname");
    expect(mockSave).toHaveBeenCalled();
    expect(result).not.toHaveProperty("password");
    expect(result.username).toBe("newname");
  });
});