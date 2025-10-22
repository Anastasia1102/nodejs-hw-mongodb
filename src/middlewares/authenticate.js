import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new createHttpError.Unauthorized('Authorization header missing');
    }

    const [bearer, accessToken] = authHeader.split(' ', 2);
    if (bearer !== 'Bearer' || typeof accessToken !== 'string') {
      throw new createHttpError.Unauthorized('Invalid authorization format');
    }

    const session = await Session.findOne({ accessToken });
    if (!session) {
      throw new createHttpError.Unauthorized('Session not found');
    }

    if (session.accessTokenValidUntil < new Date()) {
      throw new createHttpError.Unauthorized('Access token expired');
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      throw new createHttpError.Unauthorized('User not found');
    }

    req.user = user;
    req.session = session;

    next();
  } catch (err) {
    next(err);
  }
}
