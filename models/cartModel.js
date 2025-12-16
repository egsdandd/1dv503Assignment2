// models/cartModel.js

export async function getCartItem(db, userId, isbn) {
    const [rows] = await db.execute(
        'SELECT qty FROM cart WHERE userid = ? AND isbn = ?',
        [userId, isbn]
    )
    return rows[0] || null
}

export async function addItemToCart(db, userId, isbn, quantity) {
    await db.execute(
        'INSERT INTO cart (userid, isbn, qty) VALUES (?, ?, ?)',
        [userId, isbn, quantity]
    )
}

export async function updateCartItemQuantity(db, userId, isbn, newQuantity) {
    await db.execute(
        'UPDATE cart SET qty = ? WHERE userid = ? AND isbn = ?',
        [newQuantity, userId, isbn]
    )
}

export async function getCartWithDetails(db, userId) {
    const [rows] = await db.execute(
        `SELECT c.isbn,
            c.qty,
            b.title,
            b.price
     FROM cart c
     JOIN books b ON b.isbn = c.isbn
     WHERE c.userid = ?`,
        [userId]
    )
    return rows
}

export async function getCartWithUserDetails(db, userId) {
    const [rows] = await db.execute(
        `SELECT c.isbn,
            c.qty,
            b.title,
            b.price,
            m.adress    AS street,
            m.city      AS city,
            m.zip       AS zip
     FROM cart c
     JOIN books b   ON b.isbn = c.isbn
     JOIN members m ON m.userid = c.userid
     WHERE c.userid = ?`,
        [userId]
    )
    return rows
}

export async function createOrder(db, userId, orderDate, address) {
    const [result] = await db.execute(
        `INSERT INTO orders (userid, created, shipAddress, shipCity, shipZip)
     VALUES (?, ?, ?, ?, ?)`,
        [userId, orderDate, address.street, address.city, address.zip]
    )
    return result.insertId
}

export async function createOrderDetail(db, orderNumber, isbn, quantity, amount) {
    await db.execute(
        `INSERT INTO odetails (ono, isbn, qty, amount)
     VALUES (?, ?, ?, ?)`,
        [orderNumber, isbn, quantity, amount]
    )
}

export async function clearCart(db, userId) {
    await db.execute('DELETE FROM cart WHERE userid = ?', [userId])
}
