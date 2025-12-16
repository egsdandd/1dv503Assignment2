// server.js
import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session'
import dotenv from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDbConnection } from './config/db.js'
import { authRouter } from './routes/authRouter.js'
import { booksRouter } from './routes/booksRouter.js'
import { cartRouter } from './routes/cartRouter.js'
import indexRouter from './routes/indexRouter.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PORT = 3000
const SESSION_SECRET_FALLBACK = 'dev-secret'

function configureViewEngine(app) {
  app.set('view engine', 'ejs')
  app.set('views', join(__dirname, 'views'))
  app.use(expressLayouts)
  app.set('layout', 'layouts/default')
}

function configureMiddleware(app, db) {
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(join(__dirname, 'public')))

  app.use((req, res, next) => {
    req.db = db
    next()
  })

  app.use(session({
    name: process.env.SESSION_NAME || 'connect.sid',
    secret: process.env.SESSION_SECRET || SESSION_SECRET_FALLBACK,
    resave: false,
    saveUninitialized: false
  }))

  app.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
  })

  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      // console.log('REQUEST', req.method, req.url)
      next()
    })
  }
}

function configureRoutes(app) {
  app.use('/', indexRouter)
  app.use('/auth', authRouter)
  app.use('/books', booksRouter)
  app.use('/cart', cartRouter)
}

function configureErrorHandling(app) {
  app.use((req, res) => {
    res.status(404).render('errors/404')
  })

  app.use((err, req, res, next) => {
    console.error(err)
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).render('errors/500')
    }
    res.status(err.status || 500).send(err.message)
  })
}

async function startServer() {
  const db = await createDbConnection()
  const app = express()
  const port = process.env.PORT || DEFAULT_PORT

  configureViewEngine(app)
  configureMiddleware(app, db)
  configureRoutes(app)
  configureErrorHandling(app)

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
