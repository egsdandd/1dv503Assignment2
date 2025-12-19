// controllers/cartController.js
import { validationResult } from 'express-validator'
import { ROUTES } from '../config/constants.js'
import {
  getCartItem,
  addItemToCart,
  updateCartItemQuantity,
  getCartWithDetails,
  getCartWithUserDetails,
  createOrder,
  createOrderDetail,
  clearCart
} from '../models/cartModel.js'

export async function addToCart(req, res, next) {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.session.message = errors.array()[0].msg
      return res.redirect(req.get('Referrer') || ROUTES.BOOKS)
    }

    if (!req.session.user) {
      return res.redirect(ROUTES.LOGIN)
    }

    const userId = req.session.user.id
    const { isbn, qty, title } = req.body
    const quantity = Math.max(1, parseInt(qty || '1', 10))

    const existingItem = await getCartItem(req.db, userId, isbn)

    if (!existingItem) {
      await addItemToCart(req.db, userId, isbn, quantity)
    } else {
      const newQuantity = existingItem.qty + quantity
      await updateCartItemQuantity(req.db, userId, isbn, newQuantity)
    }

    req.session.message = `"${title}" added to cart!`
    res.redirect(req.get('Referrer') || ROUTES.BOOKS)
  } catch (err) {
    next(err)
  }
}

function mapCartItems(rows) {
  return rows.map(row => ({
    isbn: row.isbn,
    title: row.title,
    price: row.price,
    qty: row.qty,
    total: row.price * row.qty
  }))
}

function calculateGrandTotal(items) {
  return items.reduce((sum, item) => sum + item.total, 0)
}

export async function viewCart(req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect(ROUTES.LOGIN)
    }

    const userId = req.session.user.id
    const rows = await getCartWithDetails(req.db, userId)
    const items = mapCartItems(rows)
    const grandTotal = calculateGrandTotal(items)

    res.render('cart/index', { items, grandTotal })
  } catch (err) {
    next(err)
  }
}

function formatOrderDate(date) {
  return date.toISOString().slice(0, 10)
}

function calculateDeliveryDate(orderDate, deliveryDays) {
  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
  return new Date(orderDate.getTime() + deliveryDays * MILLISECONDS_PER_DAY)
}

async function createOrderDetails(db, orderNumber, cartItems) {
  for (const item of cartItems) {
    await createOrderDetail(db, orderNumber, item.isbn, item.qty, item.price * item.qty)
  }
}

function buildInvoiceData(orderNumber, orderDate, deliveryDate, cartItems) {
  const items = mapCartItems(cartItems)
  const grandTotal = calculateGrandTotal(items)

  return {
    orderId: orderNumber,
    orderDate,
    deliveryDate,
    address: {
      street: cartItems[0].street,
      city: cartItems[0].city,
      zip: cartItems[0].zip
    },
    items,
    grandTotal
  }
}

export async function checkout(req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect(ROUTES.LOGIN)
    }

    const userId = req.session.user.id
    const cartItems = await getCartWithUserDetails(req.db, userId)

    if (cartItems.length === 0) {
      return res.redirect(ROUTES.CART)
    }

    const orderDate = new Date()
    const deliveryDate = calculateDeliveryDate(orderDate, 7)

    const orderNumber = await createOrder(req.db, userId, formatOrderDate(orderDate), {
      street: cartItems[0].street,
      city: cartItems[0].city,
      zip: cartItems[0].zip
    })

    await createOrderDetails(req.db, orderNumber, cartItems)
    await clearCart(req.db, userId)

    const invoiceData = buildInvoiceData(orderNumber, orderDate, deliveryDate, cartItems)
    res.render('cart/invoice', invoiceData)
  } catch (err) {
    next(err)
  }
}
