import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'actowiz_task_manager_dev_jwt_secret_key_2026_xyz';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn()
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
