import { validateUserLogin, getUserProfile } from '../services/userService.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await validateUserLogin(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getUserProfile(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};
