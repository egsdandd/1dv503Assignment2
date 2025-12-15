// routes/booksRouter.js
import express from 'express'
import { listBooks } from '../controllers/booksController.js'

export const booksRouter = express.Router()

booksRouter.get('/', listBooks)
