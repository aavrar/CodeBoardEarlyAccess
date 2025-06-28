import supertest from 'supertest';
import app from '../app';
import { prisma } from '../utils/database';
import { oauthService } from '../services/oauthService';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// Mock external dependencies
jest.mock('../services/oauthService');
jest.mock('nodemailer');
jest.mock('jsonwebtoken');

// Mock prisma client methods used in oauth.ts
jest.mock('../utils/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockOauthService = oauthService as jest.Mocked<typeof oauthService>;
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('OAuth Endpoints', () => {
  const MOCK_FRONTEND_URL = 'http://localhost:3000';
  process.env.FRONTEND_URL = MOCK_FRONTEND_URL;
  process.env.JWT_SECRET = 'test_jwt_secret';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks for each test
    mockOauthService.generateGoogleAuthUrl.mockReturnValue('http://google.auth/url');
    mockOauthService.exchangeGoogleCode.mockResolvedValue({
      profile: {
        email: 'test@example.com',
        sub: 'google_user_id_123',
        email_verified: true,
        name: 'Test User',
        picture: 'http://example.com/pic.jpg',
        iss: 'https://accounts.google.com',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      tokens: { access_token: 'abc', refresh_token: 'xyz', expiry_date: 123 },
    });
    mockOauthService.detectUserTier.mockReturnValue('RESEARCHER');
    mockNodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue(true),
    } as any);
    (mockJwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'mock_user_id', tier: 'RESEARCHER' });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new_user_id',
      email: 'test@example.com',
      tier: 'RESEARCHER',
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'existing_user_id',
      email: 'existing@example.com',
      tier: 'RESEARCHER',
    });
  });

  describe('GET /api/oauth/google', () => {
    it('should redirect to Google auth URL', async () => {
      const res = await supertest(app).get('/api/oauth/google');
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe('http://google.auth/url');
    });
  });

  describe('GET /api/oauth/google/callback', () => {
    it('should redirect with error if Google returns an error', async () => {
      const res = await supertest(app).get('/api/oauth/google/callback?error=access_denied');
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe(`${MOCK_FRONTEND_URL}/?error=oauth_denied`);
    });

    it('should redirect with error if code is missing', async () => {
      const res = await supertest(app).get('/api/oauth/google/callback');
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe(`${MOCK_FRONTEND_URL}/?error=missing_code`);
    });

    it('should create a new user and redirect with token if user does not exist', async () => {
      const res = await supertest(app).get('/api/oauth/google/callback?code=some_code');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockNodemailer.createTransport().sendMail).toHaveBeenCalledTimes(1);
      expect(mockJwt.sign).toHaveBeenCalledWith({ userId: 'new_user_id', tier: 'RESEARCHER' }, 'test_jwt_secret', { expiresIn: '1h' });
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe(`${MOCK_FRONTEND_URL}/?token=mock_jwt_token&tier=RESEARCHER`);
    });

    it('should update existing user and redirect with token if user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_user_id',
        email: 'existing@example.com',
        tier: 'COMMUNITY', // Simulate existing community user
      });
      mockOauthService.exchangeGoogleCode.mockResolvedValue({
        profile: {
          email: 'existing@example.com',
          sub: 'google_user_id_456',
          email_verified: true,
          name: 'Existing User',
          picture: 'http://example.com/pic.jpg',
          iss: 'https://accounts.google.com',
          aud: 'test-client-id',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        tokens: { access_token: 'abc', refresh_token: 'xyz', expiry_date: 123 },
      });

      const res = await supertest(app).get('/api/oauth/google/callback?code=some_code');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockNodemailer.createTransport().sendMail).not.toHaveBeenCalled(); // No welcome email for existing users
      expect(mockJwt.sign).toHaveBeenCalledWith({ userId: 'existing_user_id', tier: 'RESEARCHER' }, 'test_jwt_secret', { expiresIn: '1h' });
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe(`${MOCK_FRONTEND_URL}/?token=mock_jwt_token&tier=RESEARCHER`);
    });

    it('should redirect with error on server error', async () => {
      mockOauthService.exchangeGoogleCode.mockRejectedValue(new Error('Google API error'));
      const res = await supertest(app).get('/api/oauth/google/callback?code=some_code');
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe(`${MOCK_FRONTEND_URL}/?error=oauth_server_error`);
    });
  });

  describe('GET /api/oauth/user', () => {
    it('should return user data for a valid token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'mock_user_id',
        email: 'valid@example.com',
        name: 'Valid User',
        displayName: 'Valid User',
        profileImage: 'http://example.com/valid.jpg',
        tier: 'RESEARCHER',
        authProvider: 'GOOGLE',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        preferredTools: [],
      });

      const res = await supertest(app)
        .get('/api/oauth/user')
        .set('Authorization', 'Bearer mock_jwt_token');

      expect(mockJwt.verify).toHaveBeenCalledWith('mock_jwt_token', 'test_jwt_secret');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'mock_user_id' } });
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('valid@example.com');
      expect(res.body.data.tier).toBe('RESEARCHER');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await supertest(app).get('/api/oauth/user');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Authorization header missing');
    });

    it('should return 401 for an invalid token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      const res = await supertest(app)
        .get('/api/oauth/user')
        .set('Authorization', 'Bearer invalid_token');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or expired token');
    });

    it('should return 404 if user not found for valid token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await supertest(app)
        .get('/api/oauth/user')
        .set('Authorization', 'Bearer mock_jwt_token');
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });
});