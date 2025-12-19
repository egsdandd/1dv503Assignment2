// config/constants.js
import dotenv from 'dotenv'

dotenv.config()

export const ROUTES = {
  LOGIN: '/auth/login',
  CART: '/cart',
  BOOKS: '/books',
  HOME: '/'
}

export const DELIVERY_DAYS = parseInt(process.env.DELIVERY_DAYS, 10) || 7
export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 5,
  MIN_PAGE: 1,
  MIN_PAGE_SIZE: 1
}
