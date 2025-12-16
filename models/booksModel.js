// models/booksModel.js

export async function getSubjects (db) {
  const [rows] = await db.execute(
    'SELECT DISTINCT subject FROM books ORDER BY subject'
  )
  return rows.map(r => r.subject)
}

export async function getBooksPage (db, { subject, author, title, page, pageSize }) {
  const offset = (page - 1) * pageSize

  const conditions = []
  const params = []

  if (subject) {
    conditions.push('subject = ?')
    params.push(subject)
  }

  if (author) {
    conditions.push('LOWER(author) LIKE ?')
    params.push(author.toLowerCase() + '%')
  }

  if (title) {
    conditions.push('LOWER(title) LIKE ?')
    params.push('%' + title.toLowerCase() + '%')
  }

  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  // COUNT(*) med samma filter-parametrar
  const countSql = `SELECT COUNT(*) AS total FROM books ${whereClause}`
  const [countRows] = await db.execute(countSql, params)
  const total = countRows[0].total

  // LIMIT/OFFSET som rena siffror (ingen placeholder) för att undvika ER_WRONG_ARGUMENTS
  const limit = Number(pageSize) || 5
  const offsetSafe = Number(offset) || 0

  const dataSql = `
    SELECT isbn, author, title, price, subject
    FROM books
    ${whereClause}
    ORDER BY title
    LIMIT ${limit} OFFSET ${offsetSafe}
  `



  const [rows] = await db.execute(dataSql, params)

  return { rows, total }
}
