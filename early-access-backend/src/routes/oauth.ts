import express, { Request, Response } from 'express';
import { UserTier, AuthProvider } from '@prisma/client';
import { oauthService } from '../services/oauthService';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { prisma } from '../utils/database';
import { asyncHandler } from '../utils/asyncHandler';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const generateToken = (user: { id: string; tier: UserTier }) => {
  return jwt.sign({ userId: user.id, tier: user.tier }, JWT_SECRET, { expiresIn: '1h' });
};

const router: express.Router = express.Router();

// Send welcome email function (reused from app.ts)
const sendWelcomeEmail = async (email: string, name: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to CodeBoard Early Access!',
    html: `
      <p>Dear CodeBoard Early Access Member,</p>
      <p>Welcome to CodeBoard! We're thrilled to have you on board as an early access user.</p>
      <p>As a token of our appreciation, you've been granted a <strong>Researcher</strong> role, giving you access to advanced linguistic analysis tools and features upon our full launch.</p>
      <p>We'll be sending you weekly updates on our progress and exciting new developments. Our aim is for a full launch in <strong>Q4 2025</strong>.</p>
      <p>Thank you for joining us on this journey to empower linguistic research!</p>
      <p>Best regards,</p>
      <p>The CodeBoard Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

router.get('/google', (req, res) => {
  try {
    const authUrl = oauthService.generateGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    // Redirect to a simple error page or return JSON error
    res.status(500).json({ message: 'Google OAuth setup error.' });
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error callback:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=oauth_denied`);
    }

    if (!code) {
      console.error('Google OAuth callback: Missing code');
      return res.redirect(`${process.env.FRONTEND_URL}/?error=missing_code`);
    }

    const { profile } = await oauthService.exchangeGoogleCode(code as string);

    if (!profile.email) {
      console.error('Google OAuth callback: No email in profile');
      return res.redirect(`${process.env.FRONTEND_URL}/?error=no_email`);
    }

    const tier = oauthService.detectUserTier(profile.email as string);

    let user = await prisma.user.findUnique({
      where: { email: profile.email as string },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: AuthProvider.GOOGLE,
          providerUserId: profile.sub,
          emailVerified: profile.email_verified || false,
          lastLoginAt: new Date(),
          ...(tier === UserTier.RESEARCHER && user.tier === UserTier.COMMUNITY && {
            tier: UserTier.RESEARCHER
          }),
        },
      });
      // Line 115: Update existing user and generate token
      const token = generateToken(user);
      return res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&tier=${user.tier}`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.email as string,
          name: profile.name || profile.email as string,
          displayName: profile.name || profile.email as string,
          profileImage: profile.picture,
          tier: UserTier.RESEARCHER, // Always RESEARCHER for early access
          authProvider: AuthProvider.GOOGLE,
          providerUserId: profile.sub,
          emailVerified: profile.email_verified || false,
          lastLoginAt: new Date(),
        },
      });
      await sendWelcomeEmail(user.email, user.name || user.email); // Send welcome email for new users
      const token = generateToken(user);
      return res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&tier=${user.tier}`);
    }

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/?error=oauth_server_error`);
  }
});

router.get('/user', asyncHandler(async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tier: UserTier };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { // Select only necessary fields to send to frontend
        id: true,
        email: true,
        name: true,
        displayName: true,
        profileImage: true,
        tier: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
        preferredTools: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}));

export default router;