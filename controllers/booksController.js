// controllers/booksController.js
import { getSubjects, getBooksPage } from '../models/booksModel.js'

export async function listBooks(req, res, next) {
    console.log('=== listBooks CALLED ===')
    try {
        const subject = req.query.subject || ''
        const author = req.query.author || ''
        const title = req.query.title || ''

        const rawPage = Number.parseInt(req.query.page || '1', 10)
        const rawPageSize = Number.parseInt(req.query.pageSize || '5', 10)

        const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
        const pageSize = Number.isNaN(rawPageSize) || rawPageSize < 1 ? 5 : rawPageSize

        const subjects = await getSubjects(req.db)
        console.log('Subjects:', subjects)

        const { rows, total } = await getBooksPage(req.db, {
            subject: subject || null,
            author: author || null,
            title: title || null,
            page,
            pageSize
        })

        const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize)

        const message = req.session.message
        delete req.session.message

        console.log('Rendering with data:', {
            subjectsCount: subjects.length,
            booksCount: rows.length,
            total,
            page,
            pageSize,
            totalPages
        })

        res.render('books/index', {
            subjects,
            books: rows,
            filters: { subject, author, title },
            page,
            pageSize,
            total,
            totalPages,
            message
        })
    } catch (err) {
        console.error('Error in listBooks:', err)
        next(err)
    }
}
