// __tests__/controllers/cartController.test.js
import { jest } from '@jest/globals'
import { addToCart, viewCart, checkout } from '../../controllers/cartController.js'

describe('cartController', () => {
    describe('addToCart', () => {
        let req, res, next, mockDb

        beforeEach(() => {
            mockDb = {
                execute: jest.fn()
            }

            req = {
                session: {
                    user: { id: 1 }
                },
                body: {
                    isbn: '1234567890',
                    qty: '2',
                    title: 'Test Book'
                },
                db: mockDb,
                get: jest.fn().mockReturnValue('/books')
            }

            res = {
                redirect: jest.fn()
            }

            next = jest.fn()
        })

        test('should redirect to login if user is not authenticated', async () => {
            req.session.user = null

            await addToCart(req, res, next)

            expect(res.redirect).toHaveBeenCalledWith('/auth/login')
            expect(mockDb.execute).not.toHaveBeenCalled()
        })

        test('should add new book to cart', async () => {
            mockDb.execute.mockResolvedValueOnce([[]]) // No existing item
            mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }]) // Insert succeeds

            await addToCart(req, res, next)

            expect(mockDb.execute).toHaveBeenCalledWith(
                'SELECT qty FROM cart WHERE userid = ? AND isbn = ?',
                [1, '1234567890']
            )
            expect(mockDb.execute).toHaveBeenCalledWith(
                'INSERT INTO cart (userid, isbn, qty) VALUES (?, ?, ?)',
                [1, '1234567890', 2]
            )
            expect(req.session.message).toBe('"Test Book" added to cart!')
            expect(res.redirect).toHaveBeenCalledWith('/books')
        })

        test('should update quantity if book already in cart', async () => {
            mockDb.execute.mockResolvedValueOnce([[{ qty: 3 }]]) // Existing item with qty 3
            mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]) // Update succeeds

            await addToCart(req, res, next)

            expect(mockDb.execute).toHaveBeenCalledWith(
                'UPDATE cart SET qty = ? WHERE userid = ? AND isbn = ?',
                [5, 1, '1234567890'] // 3 + 2 = 5
            )
            expect(req.session.message).toBe('"Test Book" added to cart!')
            expect(res.redirect).toHaveBeenCalledWith('/books')
        })

        test('should set success message in session', async () => {
            mockDb.execute.mockResolvedValueOnce([[]])
            mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }])

            await addToCart(req, res, next)

            expect(req.session.message).toBe('"Test Book" added to cart!')
        })

        test('should handle errors', async () => {
            const error = new Error('Database error')
            mockDb.execute.mockRejectedValueOnce(error)

            await addToCart(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('viewCart', () => {
        let req, res, next, mockDb

        beforeEach(() => {
            mockDb = {
                execute: jest.fn()
            }

            req = {
                session: {
                    user: { id: 1 }
                },
                db: mockDb
            }

            res = {
                redirect: jest.fn(),
                render: jest.fn()
            }

            next = jest.fn()
        })

        test('should redirect to login if not authenticated', async () => {
            req.session.user = null

            await viewCart(req, res, next)

            expect(res.redirect).toHaveBeenCalledWith('/auth/login')
            expect(mockDb.execute).not.toHaveBeenCalled()
        })

        test('should render cart with items and total', async () => {
            const mockRows = [
                { isbn: '111', qty: 2, title: 'Book 1', price: 10.50 },
                { isbn: '222', qty: 1, title: 'Book 2', price: 15.00 }
            ]
            mockDb.execute.mockResolvedValueOnce([mockRows])

            await viewCart(req, res, next)

            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT c.isbn'),
                [1]
            )
            expect(res.render).toHaveBeenCalledWith('cart/index', {
                items: [
                    { isbn: '111', title: 'Book 1', price: 10.50, qty: 2, total: 21.00 },
                    { isbn: '222', title: 'Book 2', price: 15.00, qty: 1, total: 15.00 }
                ],
                grandTotal: 36.00
            })
        })

        test('should handle errors', async () => {
            const error = new Error('Database error')
            mockDb.execute.mockRejectedValueOnce(error)

            await viewCart(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('checkout', () => {
        let req, res, next, mockDb

        beforeEach(() => {
            mockDb = {
                execute: jest.fn()
            }

            req = {
                session: {
                    user: { id: 1 }
                },
                db: mockDb
            }

            res = {
                redirect: jest.fn(),
                render: jest.fn()
            }

            next = jest.fn()
        })

        test('should redirect to login if not authenticated', async () => {
            req.session.user = null

            await checkout(req, res, next)

            expect(res.redirect).toHaveBeenCalledWith('/auth/login')
            expect(mockDb.execute).not.toHaveBeenCalled()
        })

        test('should redirect to cart if cart is empty', async () => {
            mockDb.execute.mockResolvedValueOnce([[]])

            await checkout(req, res, next)

            expect(res.redirect).toHaveBeenCalledWith('/cart')
        })

        test('should create order and order details', async () => {
            const mockCartRows = [
                { isbn: '111', qty: 2, title: 'Book 1', price: 10, street: 'Street 1', city: 'City', zip: '12345' }
            ]
            mockDb.execute
                .mockResolvedValueOnce([mockCartRows]) // Get cart
                .mockResolvedValueOnce([{ insertId: 100 }]) // Insert order
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // Insert order details
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // Delete cart

            await checkout(req, res, next)

            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO orders'),
                expect.arrayContaining([1, expect.any(String), 'Street 1', 'City', '12345'])
            )
            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO odetails'),
                [100, '111', 2, 20]
            )
        })

        test('should clear cart after checkout', async () => {
            const mockCartRows = [
                { isbn: '111', qty: 1, title: 'Book 1', price: 10, street: 'Street 1', city: 'City', zip: '12345' }
            ]
            mockDb.execute
                .mockResolvedValueOnce([mockCartRows])
                .mockResolvedValueOnce([{ insertId: 100 }])
                .mockResolvedValueOnce([{ affectedRows: 1 }])
                .mockResolvedValueOnce([{ affectedRows: 1 }])

            await checkout(req, res, next)

            expect(mockDb.execute).toHaveBeenCalledWith(
                'DELETE FROM cart WHERE userid = ?',
                [1]
            )
        })

        test('should render invoice with correct data', async () => {
            const mockCartRows = [
                { isbn: '111', qty: 2, title: 'Book 1', price: 10, street: 'Street 1', city: 'City', zip: '12345' }
            ]
            mockDb.execute
                .mockResolvedValueOnce([mockCartRows])
                .mockResolvedValueOnce([{ insertId: 100 }])
                .mockResolvedValueOnce([{ affectedRows: 1 }])
                .mockResolvedValueOnce([{ affectedRows: 1 }])

            await checkout(req, res, next)

            expect(res.render).toHaveBeenCalledWith('cart/invoice', {
                orderId: 100,
                orderDate: expect.any(Date),
                deliveryDate: expect.any(Date),
                address: {
                    street: 'Street 1',
                    city: 'City',
                    zip: '12345'
                },
                items: [
                    { isbn: '111', title: 'Book 1', price: 10, qty: 2, total: 20 }
                ],
                grandTotal: 20
            })
        })

        test('should handle errors', async () => {
            const error = new Error('Database error')
            mockDb.execute.mockRejectedValueOnce(error)

            await checkout(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
