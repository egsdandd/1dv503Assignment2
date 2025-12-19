// routes/booksRouter.js
import express from 'express'
import { query } from 'express-validator'
import { listBooks } from '../controllers/booksController.js'

export const booksRouter = express.Router()

booksRouter.get('/', [
    query('subject').optional().trim(),
    query('author').optional().trim(),
    query('title').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt()
], listBooks)
