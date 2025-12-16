// routes/indexRouter.js
import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
    res.render('home/index')
})

router.get('/db-check', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute('SELECT COUNT(*) AS count FROM books')
        res.send(`DB OK – books.count = ${rows[0].count}`)
    } catch (err) {
        next(err)
    }
})

export default router
