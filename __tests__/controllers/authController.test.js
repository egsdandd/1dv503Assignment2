// __tests__/controllers/authController.test.js
import { jest } from '@jest/globals'

// Mock express-validator BEFORE any imports
const mockValidationResult = jest.fn()
jest.unstable_mockModule('express-validator', () => ({
    validationResult: mockValidationResult,
    body: jest.fn()
}))

// Now import modules that depend on express-validator
const bcrypt = await import('bcrypt')
const authController = await import('../../controllers/authController.js')

const { showLoginForm, handleLogin, handleLogout, showRegisterForm, handleRegister } = authController

describe('authController', () => {
    let bcryptCompareSpy, bcryptHashSpy

    beforeAll(() => {
        bcryptCompareSpy = jest.spyOn(bcrypt.default, 'compare')
        bcryptHashSpy = jest.spyOn(bcrypt.default, 'hash')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })
    describe('showLoginForm', () => {
        test('should render login form with empty errors', () => {
            const req = {}
            const res = {
                render: jest.fn()
            }

            showLoginForm(req, res)

            expect(res.render).toHaveBeenCalledWith('auth/login', {
                errors: [],
                success: null,
                values: {}
            })
        })
    })

    describe('handleLogin', () => {
        let req, res, next, mockDb

        beforeEach(() => {
            mockDb = {
                execute: jest.fn()
            }

            req = {
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                },
                db: mockDb,
                session: {}
            }

            res = {
                status: jest.fn().mockReturnThis(),
                render: jest.fn(),
                redirect: jest.fn()
            }

            next = jest.fn()
        })

        test('should render errors if email is missing', async () => {
            req.body.email = ''

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid email.' }]
            })

            await handleLogin(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/login', {
                errors: ['Invalid email.'],
                success: null,
                values: { email: '' }
            })
        })

        test('should render errors if password is missing', async () => {
            req.body.password = ''

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Password is required.' }]
            })

            await handleLogin(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/login', {
                errors: ['Password is required.'],
                success: null,
                values: { email: 'test@example.com' }
            })
        })

        test('should render error if user not found', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            mockDb.execute.mockResolvedValueOnce([[]])

            await handleLogin(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/login', {
                errors: ['Invalid email or password.'],
                success: null,
                values: { email: 'test@example.com' }
            })
        })

        test('should render error if password does not match', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            const mockUser = {
                userid: 1,
                email: 'test@example.com',
                password: 'hashedpassword',
                fname: 'John',
                lname: 'Doe'
            }
            mockDb.execute.mockResolvedValueOnce([[mockUser]])
            bcryptCompareSpy.mockResolvedValueOnce(false)

            await handleLogin(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/login', {
                errors: ['Invalid email or password.'],
                success: null,
                values: { email: 'test@example.com' }
            })
        })

        test('should set session and redirect on successful login', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            const mockUser = {
                userid: 1,
                email: 'test@example.com',
                password: 'hashedpassword',
                fname: 'John',
                lname: 'Doe'
            }
            mockDb.execute.mockResolvedValueOnce([[mockUser]])
            bcryptCompareSpy.mockResolvedValueOnce(true)

            await handleLogin(req, res, next)

            expect(req.session.user).toEqual({
                id: 1,
                email: 'test@example.com',
                name: 'John Doe'
            })
            expect(res.redirect).toHaveBeenCalledWith('/')
        })

        test('should handle errors', async () => {
            const error = new Error('Database error')
            mockDb.execute.mockRejectedValueOnce(error)

            await handleLogin(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('handleLogout', () => {
        test('should destroy session and redirect', () => {
            const req = {
                session: {
                    destroy: jest.fn((callback) => callback(null))
                }
            }
            const res = {
                redirect: jest.fn()
            }
            const next = jest.fn()

            handleLogout(req, res, next)

            expect(req.session.destroy).toHaveBeenCalled()
            expect(res.redirect).toHaveBeenCalledWith('/')
        })

        test('should call next with error if session destroy fails', () => {
            const error = new Error('Session error')
            const req = {
                session: {
                    destroy: jest.fn((callback) => callback(error))
                }
            }
            const res = {
                redirect: jest.fn()
            }
            const next = jest.fn()

            handleLogout(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('showRegisterForm', () => {
        test('should render register form with empty errors', () => {
            const req = {}
            const res = {
                render: jest.fn()
            }

            showRegisterForm(req, res)

            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: [],
                success: null,
                values: {}
            })
        })
    })

    describe('handleRegister', () => {
        let req, res, next, mockDb

        beforeEach(() => {
            mockDb = {
                execute: jest.fn()
            }

            req = {
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Stockholm',
                    zip: '12345',
                    phone: '1234567890',
                    email: 'john@example.com',
                    password: 'password123'
                },
                db: mockDb
            }

            res = {
                status: jest.fn().mockReturnThis(),
                render: jest.fn(),
                redirect: jest.fn()
            }

            next = jest.fn()
        })

        test('should render errors if first or last name is missing', async () => {
            req.body.firstName = ''

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'First name is required.' }]
            })

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['First name is required.'],
                success: null,
                values: expect.any(Object)
            })
        })

        test('should render errors if address or city is missing', async () => {
            req.body.address = ''

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Address is required.' }]
            })

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['Address is required.'],
                success: null,
                values: expect.any(Object)
            })
        })

        test('should render errors if zip code contains letters', async () => {
            req.body.zip = '123ab'

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Zip code must contain only numbers.' }]
            })

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['Zip code must contain only numbers.'],
                success: null,
                values: expect.any(Object)
            })
        })

        test('should render errors if zip code is not 5 digits', async () => {
            req.body.zip = '123'

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Zip code must be exactly 5 digits.' }]
            })

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['Zip code must be exactly 5 digits.'],
                success: null,
                values: expect.any(Object)
            })
        })

        test('should accept zip code with spaces and remove them', async () => {
            req.body.zip = '123 45'

            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            bcryptHashSpy.mockResolvedValueOnce('hashedpassword')
            mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }])

            await handleRegister(req, res, next)

            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO members'),
                expect.arrayContaining(['12345']) // Space removed
            )
        })

        test('should render errors if email is invalid', async () => {
            req.body.email = 'invalid-email'

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid email.' }]
            })

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['Invalid email.'],
                success: null,
                values: expect.any(Object)
            })
        })

        test('should render errors if password is too short', async () => {
            req.body.password = '123'

            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Password must be at least 6 characters.' }]
            })

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['Password must be at least 6 characters.'], success: null, values: expect.any(Object)
            })
        })

        test('should create member and show success message', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            bcryptHashSpy.mockResolvedValueOnce('hashedpassword')
            mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }])

            await handleRegister(req, res, next)

            expect(bcryptHashSpy).toHaveBeenCalledWith('password123', 10)
            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO members'),
                expect.arrayContaining(['John', 'Doe', '123 Main St', 'Stockholm', '12345', '1234567890', 'john@example.com', 'hashedpassword'])
            )
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: [],
                success: 'Account created successfully.',
                values: {}
            })
        })

        test('should handle duplicate email error', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            bcryptHashSpy.mockResolvedValueOnce('hashedpassword')
            const error = new Error('Duplicate entry')
            error.code = 'ER_DUP_ENTRY'
            mockDb.execute.mockRejectedValueOnce(error)

            await handleRegister(req, res, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                errors: ['Email is already registered.'],
                success: null,
                values: req.body
            })
        })

        test('should handle other errors', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => true })
            bcryptHashSpy.mockResolvedValueOnce('hashedpassword')
            const error = new Error('Database error')
            mockDb.execute.mockRejectedValueOnce(error)

            await handleRegister(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
