// config/db.js
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export async function createDbConnection () {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'book_store'
  })
  return connection
}
