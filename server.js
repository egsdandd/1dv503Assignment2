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

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

async function startServer() {
  // Koppla upp mot MySQL
  const db = await createDbConnection()

  const app = express()
  const port = process.env.PORT || 3000

  // View engine & layouts
  app.set('view engine', 'ejs')
  app.set('views', join(__dirname, 'views'))
  app.use(expressLayouts)  // tog bort kommentar på dessa 2 rader
  app.set('layout', 'layouts/default')

  // Grund‑middleware
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(join(__dirname, 'public')))

  // Gör db tillgänglig på req (måste ligga före routrar som använder req.db)
  app.use((req, res, next) => {
    req.db = db
    next()
  })

  // Sessioner
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false
  }))

  // Gör inloggad användare tillgänglig i alla views
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
  })


  // Routrar
  app.use((req, res, next) => {
  console.log('REQUEST', req.method, req.url);
  next();
});

  app.use('/auth', authRouter)
  app.use('/books', booksRouter)
  app.use('/cart', cartRouter)

  // Startsida
  app.get('/', (req, res) => {
    res.render('home/index')
  })

  // Enkel DB‑hälsokoll
  app.get('/db-check', async (req, res, next) => {
    try {
      const [rows] = await req.db.execute('SELECT COUNT(*) AS count FROM books')
      res.send(`DB OK – books.count = ${rows[0].count}`)
    } catch (err) {
      next(err)
    }
  })

  // 404
  app.use((req, res) => {
    res.status(404).render('errors/404')
  })

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err)
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).render('errors/500')
    }
    res.status(err.status || 500).send(err.message)
  })

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
