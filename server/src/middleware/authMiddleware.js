import { verifyToken } from '../utils/jwt.js';
import userRepository from '../repositories/userRepository.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Session expired or invalid token' });
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User does not exist' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
