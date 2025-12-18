// config/db.js
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export async function createDbConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'book_store'
    })

    console.log(`✓ Database connected: ${process.env.DB_NAME || 'book_store'}@${process.env.DB_HOST || 'localhost'}`)
    return connection
  } catch (err) {
    console.error('✗ Database connection failed:', err.message)
    process.exit(1)
  }
}
