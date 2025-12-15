// controllers/cartController.js

export async function addToCart (req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login')
    }

    const userid = req.session.user.id
    const { isbn, qty } = req.body
    const quantity = Math.max(1, parseInt(qty || '1', 10))

    // Finns redan i cart?
    const [rows] = await req.db.execute(
      'SELECT qty FROM cart WHERE userid = ? AND isbn = ?',
      [userid, isbn]
    )

    if (rows.length === 0) {
      await req.db.execute(
        'INSERT INTO cart (userid, isbn, qty) VALUES (?, ?, ?)',
        [userid, isbn, quantity]
      )
    } else {
      const newQty = rows[0].qty + quantity
      await req.db.execute(
        'UPDATE cart SET qty = ? WHERE userid = ? AND isbn = ?',
        [newQty, userid, isbn]
      )
    }

    // Tillbaka till samma sida med samma filter (enkel variant)
    res.redirect('back')
  } catch (err) {
    next(err)
  }
}
