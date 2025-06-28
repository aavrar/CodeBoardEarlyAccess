import supertest from 'supertest';
import app from '../app';
import { prisma } from '../utils/database';

describe('E2E Auth Endpoints with Real Database', () => {
  let createdUserEmail: string | null = null;

  afterAll(async () => {
    if (createdUserEmail) {
      try {
        await prisma.user.delete({ where: { email: createdUserEmail } });
        console.log(`Cleaned up user: ${createdUserEmail}`);
      } catch (error) {
        console.error('Error cleaning up user:', error);
      }
    }
    await prisma.$disconnect();
  });

  describe('POST /signup', () => {
    it('should create a new user in the database', async () => {
      const userEmail = `test-user-${Date.now()}@example.com`;
      createdUserEmail = userEmail;

      const res = await supertest(app)
        .post('/signup')
        .send({
          email: userEmail,
          password: 'password123',
          name: 'E2E Test User',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Sign-up successful!');

      // Verify the user was actually created in the database
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(userEmail);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login the newly created user', async () => {
        const userEmail = `login-test-${Date.now()}@example.com`;
        createdUserEmail = userEmail; // Ensure cleanup even if this test runs standalone
  
        // First, create the user to login with
        await supertest(app)
          .post('/signup')
          .send({
            email: userEmail,
            password: 'password123',
            name: 'Login Test User',
          });
  
        // Now, attempt to login
        const res = await supertest(app)
          .post('/api/auth/login')
          .send({
            email: userEmail,
            password: 'password123',
          });
  
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
      });
  });
});
