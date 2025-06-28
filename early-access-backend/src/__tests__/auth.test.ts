import supertest from 'supertest';
import app from '../app';
import { prisma } from '../utils/database';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('Auth Endpoints', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  // Before each test, tell the mock factory to return our single mock client
  beforeEach(() => {
    jest.clearAllMocks();
    // We are no longer mocking createPrismaClient, so we directly mock prisma methods
    prisma.user.findUnique = mockPrismaClient.user.findUnique;
    prisma.user.create = mockPrismaClient.user.create;
    prisma.user.update = mockPrismaClient.user.update;
    prisma.$disconnect = mockPrismaClient.$disconnect;
  });

  describe('POST /signup', () => {
    it('should create a new user and return 201', async () => {
      // Arrange
      const newUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockPrismaClient.user.create.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      // Act
      const res = await supertest(app)
        .post('/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      // Assert
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Sign-up successful!');
      expect(res.body.user).toEqual({ id: '1', email: 'test@example.com' });
      expect(mockPrismaClient.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should return 200 if email already exists', async () => {
      // Arrange
      mockPrismaClient.user.create.mockRejectedValue({ code: 'P2002' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      // Act
      const res = await supertest(app)
        .post('/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Email already registered.');
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user and return a token', async () => {
        // Arrange
        const existingUser = { id: '1', email: 'test@example.com', passwordHash: 'hashedpassword' };
        mockPrismaClient.user.findUnique.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Mock password check to be successful

        // Act
        const res = await supertest(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
            });

        // Assert
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBe('early-access-token-1');
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
        expect(mockPrismaClient.user.update).toHaveBeenCalledTimes(1);
        expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should return 401 for invalid password', async () => {
        // Arrange
        const existingUser = { id: '1', email: 'test@example.com', passwordHash: 'hashedpassword' };
        mockPrismaClient.user.findUnique.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Mock password check to fail

        // Act
        const res = await supertest(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });

        // Assert
        expect(res.statusCode).toEqual(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid email or password.');
        expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});