import express, { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { asyncHandler } from '../utils/asyncHandler';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Submit a new contribution
router.post('/submit', asyncHandler(async (req: Request, res: Response) => {
  const { text, languages, context, region, platform, age, userEmail, userName } = req.body;

  // Basic validation
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Text is required.' });
  }

  if (!languages || !Array.isArray(languages) || languages.length < 2) {
    return res.status(400).json({ message: 'At least 2 languages must be selected.' });
  }

  try {
    // Create contribution record
    const contribution = await prisma.contribution.create({
      data: {
        text: text.trim(),
        languages,
        context: context || null,
        region: region || null,
        platform: platform || null,
        age: age || null,
        userEmail: userEmail || null,
        userName: userName || null,
        submittedAt: new Date(),
      },
    });

    // Send confirmation email if user provided email
    if (userEmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_PORT === '465',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: 'Thank you for your contribution to CodeBoard!',
          html: `
            <p>Dear ${userName || 'CodeBoard Contributor'},</p>
            <p>Thank you for contributing to the CodeBoard corpus! Your example has been successfully submitted:</p>
            <blockquote style="background: #f5f5f5; padding: 10px; border-left: 3px solid #14b8a6;">
              "${text}"
            </blockquote>
            <p><strong>Languages:</strong> ${languages.join(', ')}</p>
            ${context ? `<p><strong>Context:</strong> ${context}</p>` : ''}
            <p>Your contribution helps researchers worldwide understand multilingual communication better. Every example matters!</p>
            <p>We'll keep you updated on how your contributions are making an impact.</p>
            <p>Best regards,</p>
            <p>The CodeBoard Team</p>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      message: 'Contribution submitted successfully!',
      contribution: {
        id: contribution.id,
        submittedAt: contribution.submittedAt,
      },
    });

  } catch (error: any) {
    console.error('Error submitting contribution:', error);
    res.status(500).json({ message: 'Could not submit contribution.' });
  }
}));

// Get contribution statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const [totalContributions, uniqueContributors, languagePairs] = await Promise.all([
      prisma.contribution.count(),
      prisma.contribution.groupBy({
        by: ['userEmail'],
        where: {
          userEmail: {
            not: null,
          },
        },
        _count: true,
      }),
      prisma.contribution.findMany({
        select: {
          languages: true,
        },
      }),
    ]);

    // Calculate unique language pairs
    const pairs = new Set();
    languagePairs.forEach(item => {
      if (item.languages.length >= 2) {
        const sorted = [...item.languages].sort();
        for (let i = 0; i < sorted.length - 1; i++) {
          for (let j = i + 1; j < sorted.length; j++) {
            pairs.add(`${sorted[i]}-${sorted[j]}`);
          }
        }
      }
    });

    res.json({
      totalContributions,
      uniqueContributors: uniqueContributors.length,
      languagePairs: pairs.size,
    });

  } catch (error: any) {
    console.error('Error fetching contribution statistics:', error);
    res.status(500).json({ message: 'Could not fetch contribution statistics.' });
  }
}));

export default router;