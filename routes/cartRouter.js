// routes/cartRouter.js
import express from 'express'
import { addToCart, viewCart, checkout } from '../controllers/cartController.js'

export const cartRouter = express.Router()
// console.log('cartRouter loaded');

cartRouter.post('/add', addToCart)
cartRouter.get('/', viewCart)
cartRouter.post('/checkout', checkout) 
cartRouter.get('/test', (req, res) => {
  res.send('cart test works');
});
