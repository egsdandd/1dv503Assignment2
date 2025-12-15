// models/membersModel.js
import bcrypt from 'bcrypt'

export async function createMember (db, data) {
  const passwordHash = await bcrypt.hash(data.password, 10)

  const sql = `
    INSERT INTO members
      (fname, lname, adress, city, zip, phone, email, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `

  const params = [
    data.firstName,
    data.lastName,
    data.address,
    data.city,
    data.zip,
    data.phone,
    data.email,
    passwordHash
  ]

  const [result] = await db.execute(sql, params)
  return { userid: result.insertId, email: data.email }
}
