// routes/cartRouter.js
import express from 'express'
import { body } from 'express-validator'
import { addToCart, viewCart, checkout } from '../controllers/cartController.js'

export const cartRouter = express.Router()

cartRouter.post('/add', [
  body('isbn').trim().notEmpty().withMessage('ISBN is required.'),
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1.').toInt()
], addToCart)

cartRouter.get('/', viewCart)
cartRouter.post('/checkout', checkout)
