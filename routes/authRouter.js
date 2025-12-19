// routes/authRouter.js
import express from 'express'
import { body } from 'express-validator'
import {
  showRegisterForm,
  handleRegister,
  showLoginForm,
  handleLogin,
  handleLogout
} from '../controllers/authController.js'

export const authRouter = express.Router()

authRouter.get('/register', showRegisterForm)
authRouter.post(
  '/register',
  [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required.')
      .isLength({ max: 100 }),
    body('lastName').trim().notEmpty().withMessage('Last name is required.').isLength({ max: 100 }),
    body('address').trim().notEmpty().withMessage('Address is required.').isLength({ max: 255 }),
    body('city').trim().notEmpty().withMessage('City is required.').isLength({ max: 100 }),
    body('zip')
      .trim()
      .isLength({ min: 5, max: 5 })
      .withMessage('Zip code must be exactly 5 digits.')
      .isNumeric()
      .withMessage('Zip code must contain only numbers.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.').isLength({ max: 20 }),
    body('email').trim().isEmail().withMessage('Invalid email.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  ],
  handleRegister
)

authRouter.get('/login', showLoginForm)
authRouter.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Invalid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  handleLogin
)

authRouter.post('/logout', handleLogout)
