// controllers/booksController.js
import { getSubjects, getBooksPage } from '../models/booksModel.js'
import { parsePositiveInteger, extractFilters, convertEmptyToNull } from '../utils/validators.js'
import { PAGINATION_DEFAULTS } from '../config/constants.js'

function calculateTotalPages(total, pageSize) {
  return total === 0 ? 1 : Math.ceil(total / pageSize)
}

function extractAndClearSessionMessage(session) {
  const message = session.message
  delete session.message
  return message
}

function buildFilterParams(filters) {
  return {
    subject: convertEmptyToNull(filters.subject),
    author: convertEmptyToNull(filters.author),
    title: convertEmptyToNull(filters.title)
  }
}

export async function listBooks(req, res, next) {
  // console.log('=== listBooks CALLED ===')
  try {
    const filters = extractFilters(req.query)
    const page = parsePositiveInteger(req.query.page, PAGINATION_DEFAULTS.PAGE)
    const pageSize = parsePositiveInteger(req.query.pageSize, PAGINATION_DEFAULTS.PAGE_SIZE)

    const subjects = await getSubjects(req.db)
    // console.log('Subjects:', subjects)

    const filterParams = buildFilterParams(filters)
    const { rows, total } = await getBooksPage(req.db, {
      ...filterParams,
      page,
      pageSize
    })

    const totalPages = calculateTotalPages(total, pageSize)
    const message = extractAndClearSessionMessage(req.session)

    res.render('books/index', {
      subjects,
      books: rows,
      filters,
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
