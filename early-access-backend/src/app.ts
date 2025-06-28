import express, { Request, Response } from 'express';
import { UserTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import oauthRouter from './routes/oauth';
import contributionsRouter from './routes/contributions';
import { prisma } from './utils/database';
import { asyncHandler } from './utils/asyncHandler';

dotenv.config();

const app = express();

app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mount routes
app.use('/api/oauth', oauthRouter);
app.use('/api/contributions', contributionsRouter);

// Ping endpoint
app.get('/api/ping', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Early Access Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Examples endpoint
app.get('/api/examples', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { examples: [], totalCount: 0, page: 1, totalPages: 0 }
  });
});

app.post('/api/examples', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { text, languages, context, region, platform, age, userId } = req.body;
    console.log('Received contribution request:', { text, languages, context, region, platform, age, userId });
    const example = await prisma.example.create({
      data: {
        text,
        languages,
        context,
        region,
        platform,
        age,
        userId: userId || null,
        isVerified: false,
        isPublic: true
      }
    });
    console.log('Contribution saved successfully:', example);
    res.json({
      success: true,
      message: 'Thank you for your contribution!',
      data: { id: example.id, text: example.text }
    });
  } catch (error: any) {
    console.error('Error saving contribution:', error);
    res.status(500).json({ success: false, message: 'Could not save contribution.' });
  }
}));

// Dashboard metrics endpoint
app.get('/api/dashboard/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const exampleCount = await prisma.example.count();
    
    const showRealStats = userCount >= 100 && exampleCount >= 500;
    
    if (showRealStats) {
      const languagePairs = await prisma.example.groupBy({
        by: ['languages'],
        _count: true,
      });
      res.json({
        success: true,
        data: {
          totalExamples: exampleCount,
          contributors: userCount,
          languagePairs: languagePairs.length,
          isReal: true
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          totalExamples: 15000,
          contributors: 2500,
          languagePairs: 35,
          isReal: false,
          currentProgress: { users: userCount, examples: exampleCount },
          goalDescription: "Target metrics for full platform launch"
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, message: 'Could not fetch dashboard metrics.' });
  }
}));

// Login endpoint
app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, tier: user.tier },
        token: 'early-access-token-' + user.id
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login.' });
  }
}));

// Get user from token
app.get('/api/oauth/user', asyncHandler(async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    if (!token.startsWith('early-access-token-')) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }
    
    const userId = token.replace('early-access-token-', '');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, tier: user.tier }
    });
  } catch (error: any) {
    console.error('Error fetching user from token:', error);
    res.status(500).json({ success: false, message: 'Could not fetch user.' });
  }
}));

// Signup endpoint
app.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, emailOptIn } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Valid email and a password of at least 6 characters are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        emailOptIn: emailOptIn !== false,
        tier: UserTier.RESEARCHER,
      },
    });

    // Email sending logic (unchanged)
    // ...

    res.status(201).json({ message: 'Sign-up successful!', user: { id: user.id, email: user.email } });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(200).json({ message: 'Email already registered.', alreadyExists: true });
    }
    console.error('Error during sign-up:', error);
    res.status(500).json({ message: 'An error occurred during sign-up.' });
  }
}));

export default app;
