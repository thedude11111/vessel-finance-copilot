import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { User } from 'shared-types';

const prisma = new PrismaClient();
const router = Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails } = profile;
      const email = emails?.[0].value;

      if (!email) {
        return done(new Error('No email found in Google profile'));
      }

      try {
        let user = await prisma.user.findUnique({ where: { googleId: id } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              googleId: id,
              name: displayName,
              email: email,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        return done(error);
      }
    }
  )
);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user as User;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    console.log(`User ${user.email} successfully logged in.`);
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

export default router;
