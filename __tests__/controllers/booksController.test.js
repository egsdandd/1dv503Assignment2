// __tests__/controllers/booksController.test.js
import { jest } from '@jest/globals'
import { listBooks } from '../../controllers/booksController.js'

describe('booksController', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('listBooks', () => {
    let req, res, next, mockDb

    beforeEach(() => {
      mockDb = { execute: jest.fn() }
      req = { query: {}, db: mockDb, session: {} }
      res = { render: jest.fn() }
      next = jest.fn()
    })

    test('should use default values when no query parameters provided', async () => {
      // Mock getSubjects query
      mockDb.execute.mockResolvedValueOnce([
        [{ subject: 'Fiction' }, { subject: 'Science' }, { subject: 'History' }]
      ])

      // Mock count query (getBooksPage's first query)
      mockDb.execute.mockResolvedValueOnce([[{ total: 1 }]])

      // Mock getBooksPage data query
      mockDb.execute.mockResolvedValueOnce([
        [{ isbn: '111', title: 'Book 1', author: 'Author 1', price: 10, subject: 'Fiction' }]
      ])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith('books/index', {
        subjects: ['Fiction', 'Science', 'History'],
        books: [
          { isbn: '111', title: 'Book 1', author: 'Author 1', price: 10, subject: 'Fiction' }
        ],
        filters: { subject: '', author: '', title: '' },
        page: 1,
        pageSize: 5,
        total: 1,
        totalPages: 1,
        message: undefined
      })
    })

    test('should apply filters from query parameters', async () => {
      req.query = {
        subject: 'Fiction',
        author: 'John Doe',
        title: 'Test',
        page: '2',
        pageSize: '10'
      }

      // Mock getSubjects
      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }, { subject: 'Science' }]])

      // Mock count query
      mockDb.execute.mockResolvedValueOnce([[{ total: 20 }]])

      // Mock data query
      mockDb.execute.mockResolvedValueOnce([
        [{ isbn: '222', title: 'Test Book', author: 'John Doe', price: 15, subject: 'Fiction' }]
      ])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'books/index',
        expect.objectContaining({
          page: 2,
          pageSize: 10,
          total: 20,
          totalPages: 2
        })
      )
    })

    test('should handle invalid page number and default to 1', async () => {
      req.query.page = 'invalid'

      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 0 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith('books/index', expect.objectContaining({ page: 1 }))
    })

    test('should handle invalid pageSize and default to 5', async () => {
      req.query.pageSize = 'invalid'

      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 0 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'books/index',
        expect.objectContaining({ pageSize: 5 })
      )
    })

    test('should handle negative page number and default to 1', async () => {
      req.query.page = '-5'

      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 0 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith('books/index', expect.objectContaining({ page: 1 }))
    })

    test('should calculate totalPages correctly', async () => {
      req.query.pageSize = '10'

      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 23 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'books/index',
        expect.objectContaining({ totalPages: 3 })
      )
    })

    test('should set totalPages to 1 when total is 0', async () => {
      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 0 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'books/index',
        expect.objectContaining({ totalPages: 1 })
      )
    })

    test('should include session message and delete it', async () => {
      req.session.message = 'Book added to cart!'

      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 0 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'books/index',
        expect.objectContaining({
          message: 'Book added to cart!'
        })
      )
      expect(req.session.message).toBeUndefined()
    })

    test('should handle errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      const error = new Error('Database error')
      mockDb.execute.mockRejectedValueOnce(error)

      await listBooks(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in listBooks:', error)
      consoleErrorSpy.mockRestore()
    })

    test('should convert empty string filters to null', async () => {
      req.query = { subject: '', author: '', title: '' }

      mockDb.execute.mockResolvedValueOnce([[{ subject: 'Fiction' }]])
      mockDb.execute.mockResolvedValueOnce([[{ total: 0 }]])
      mockDb.execute.mockResolvedValueOnce([[]])

      await listBooks(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'books/index',
        expect.objectContaining({
          filters: { subject: '', author: '', title: '' }
        })
      )
    })
  })
})
