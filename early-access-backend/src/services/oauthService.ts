import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002'; // Use backend URL for redirect

const googleOAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/api/oauth/google/callback`
);

export const oauthService = {
  generateGoogleAuthUrl: () => {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      prompt: 'consent',
    });
  },

  exchangeGoogleCode: async (code: string) => {
    const { tokens } = await googleOAuth2Client.getToken(code);
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();

    if (!profile) {
      throw new Error('Failed to get Google profile from ID token.');
    }

    return { tokens, profile };
  },

  // Simplified tier detection for early access - always RESEARCHER
  detectUserTier: (email: string) => {
    // In the main app, this might check for .edu emails or other criteria.
    // For early access, all sign-ups are RESEARCHER.
    return 'RESEARCHER';
  },
};
