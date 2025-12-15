// controllers/authController.js
import bcrypt from 'bcrypt'
import { createMember } from '../models/membersModel.js'
import validator from 'validator'

export function showLoginForm (req, res) {
  res.render('auth/login', { errors: [], success: null, values: {} })
}

export async function handleLogin (req, res, next) {
  try {
    const { email, password } = req.body
    const errors = []

    if (!email) errors.push('Email is required.')
    if (!password) errors.push('Password is required.')

    if (errors.length > 0) {
      return res.status(400).render('auth/login', {
        errors,
        success: null,
        values: { email }
      })
    }

    // Hämta medlem från DB
    const [rows] = await req.db.execute(
      'SELECT userid, email, password, fname, lname FROM members WHERE email = ? LIMIT 1',
      [email]
    )

    const user = rows[0]

    if (!user) {
      return res.status(400).render('auth/login', {
        errors: ['Invalid email or password.'],
        success: null,
        values: { email }
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(400).render('auth/login', {
        errors: ['Invalid email or password.'],
        success: null,
        values: { email }
      })
    }

    // Spara minimal user‑info i sessionen
    req.session.user = {
      id: user.userid,
      email: user.email,
      name: `${user.fname} ${user.lname}`
    }

    // Visa enkel success eller redirecta till startsidan
    return res.redirect('/')
  } catch (err) {
    next(err)
  }
}

export function handleLogout (req, res, next) {
  req.session.destroy(err => {
    if (err) return next(err)
    res.redirect('/')
  })
}

export function showRegisterForm (req, res) {
  res.render('auth/register', { errors: [], success: null, values: {} })
}
export async function handleRegister(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      address,
      city,
      zip,
      phone,
      email,
      password
    } = req.body

    const errors = []

    if (!firstName || !lastName) errors.push('First and last name are required.')
    if (!address || !city) errors.push('Address and city are required.')
    if (!zip || !validator.isPostalCode(zip + '', 'any')) {
      errors.push('Invalid zip code.')
    }
    if (!phone) errors.push('Phone number is required.')
    if (!email || !validator.isEmail(email)) {
      errors.push('Invalid email.')
    }
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters.')
    }

    if (errors.length > 0) {
      return res.status(400).render('auth/register', {
        errors,
        values: { firstName, lastName, address, city, zip, phone, email }
      })
    }

    // Försök skapa medlem (modell sköter unik e‑post)
    const member = await createMember(req.db, {
      firstName,
      lastName,
      address,
      city,
      zip,
      phone,
      email,
      password
    })
    return res.render('auth/register', {
      errors: [],
      success: 'Account created successfully.',
      values: {}
    })

    // TODO: sätt session här om du vill auto‑logga in
    res.redirect('/')
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('auth/register', {
        errors: ['Email is already registered.'],
        values: req.body
      })
    }
    next(err)
  }
}
