// controllers/authController.js
import bcrypt from 'bcrypt'
import { validationResult } from 'express-validator'
import { createMember } from '../models/membersModel.js'
import { findUserByEmail } from '../models/authModel.js'
import { ROUTES } from '../config/constants.js'

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.'

export function showLoginForm(req, res) {
  res.render('auth/login', { errors: [], success: null, values: {} })
}

function renderLoginError(res, errors, email) {
  return res.status(400).render('auth/login', {
    errors,
    success: null,
    values: { email }
  })
}

export async function handleLogin(req, res, next) {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return renderLoginError(res, errors.array().map(e => e.msg), req.body.email || '')
    }

    const { email, password } = req.body
    const user = await findUserByEmail(req.db, email)

    if (!user) {
      return renderLoginError(res, [INVALID_CREDENTIALS_MESSAGE], email)
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return renderLoginError(res, [INVALID_CREDENTIALS_MESSAGE], email)
    }

    req.session.user = {
      id: user.userid,
      email: user.email,
      name: `${user.fname} ${user.lname}`
    }

    return res.redirect(ROUTES.HOME)
  } catch (err) {
    next(err)
  }
}

export function handleLogout(req, res, next) {
  req.session.destroy(err => {
    if (err) return next(err)
    res.redirect(ROUTES.HOME)
  })
}

export function showRegisterForm(req, res) {
  res.render('auth/register', { errors: [], success: null, values: {} })
}

function extractRegisterValues(body) {
  const { firstName, lastName, address, city, zip, phone, email } = body
  return { firstName, lastName, address, city, zip, phone, email }
}

export async function handleRegister(req, res, next) {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).render('auth/register', {
        errors: errors.array().map(e => e.msg),
        success: null,
        values: extractRegisterValues(req.body)
      })
    }

    await createMember(req.db, req.body)

    return res.render('auth/register', {
      errors: [],
      success: 'Account created successfully.',
      values: {}
    })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('auth/register', {
        errors: ['Email is already registered.'],
        success: null,
        values: req.body
      })
    }
    next(err)
  }
}
