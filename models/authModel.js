// models/authModel.js

export async function findUserByEmail(db, email) {
    const [rows] = await db.execute(
        'SELECT userid, email, password, fname, lname FROM members WHERE email = ? LIMIT 1',
        [email]
    )
    return rows[0] || null
}
