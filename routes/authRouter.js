// routes/authRouter.js
import express from 'express'
import {
  showRegisterForm,
  handleRegister,
  showLoginForm,
  handleLogin,
  handleLogout
} from '../controllers/authController.js'

export const authRouter = express.Router()

authRouter.get('/register', showRegisterForm)
authRouter.post('/register', handleRegister)

authRouter.get('/login', showLoginForm)
authRouter.post('/login', handleLogin)

authRouter.post('/logout', handleLogout)
