// controllers/cartController.js

export async function addToCart(req, res, next) {
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
    // res.redirect(req.get('Referrer') || '/books')
    // res.redirect('/book')
  } catch (err) {
    next(err)
  }
}

// Visa kundvagn
export async function viewCart(req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const userid = req.session.user.id;

    // Hämta cart-rader + bokinfo
    const [rows] = await req.db.execute(
      `SELECT c.isbn,
              c.qty,
              b.title,
              b.price
       FROM cart c
       JOIN books b ON b.isbn = c.isbn
       WHERE c.userid = ?`,
      [userid]
    );

    const items = rows.map(row => ({
      isbn: row.isbn,
      title: row.title,
      price: row.price,
      qty: row.qty,
      total: row.price * row.qty
    }));

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    res.render('cart/index', { items, grandTotal });
  } catch (err) {
    next(err);
  }
}

/*
export async function viewCart(req, res, next) {
  try {
    res.send('VIEW CART OK');
  } catch (err) {
    next(err);
  }
}
*/
export async function checkout(req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login')
    }

    const userid = req.session.user.id

    // 1. Hämta cart + bokinfo för användaren
    const [rows] = await req.db.execute(
      `SELECT c.isbn,
              c.qty,
              b.title,
              b.price,
              m.address   AS street,
              m.city      AS city,
              m.zipCode   AS zip
       FROM cart c
       JOIN books b   ON b.isbn = c.isbn
       JOIN members m ON m.id   = c.userid
       WHERE c.userid = ?`,
      [userid]
    )

    if (rows.length === 0) {
      // tom cart → tillbaka till /cart
      return res.redirect('/cart')
    }

    const orderDate    = new Date()
    const deliveryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 dagar

    // 2. Skapa order-rad i "order" (orders)
    const [orderResult] = await req.db.execute(
      `INSERT INTO \`order\` (userid, order_date, shippedAddress, shippedCity, shippedZipCode)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userid,
        orderDate.toISOString().slice(0, 10),  // YYYY-MM-DD
        rows[0].street,
        rows[0].city,
        rows[0].zip
      ]
    )

    const orderId = orderResult.insertId

    // 3. Skapa order_details-rader
    const detailsValues = rows.map(row => [
      orderId,
      row.isbn,
      row.qty,
      row.price * row.qty
    ])

    await req.db.execute(
      `INSERT INTO order_details (orderid, isbn, qty, amount)
       VALUES ?`,
      [detailsValues]
    )

    // 4. Töm cart för användaren
    await req.db.execute('DELETE FROM cart WHERE userid = ?', [userid])

    // 5. Bygg data för invoice-vyn
    const items = rows.map(row => ({
      isbn:   row.isbn,
      title:  row.title,
      price:  row.price,
      qty:    row.qty,
      total:  row.price * row.qty
    }))
    const grandTotal = items.reduce((sum, i) => sum + i.total, 0)

    res.render('cart/invoice', {
      orderId,
      orderDate,
      deliveryDate,              // visas bara, lagras inte
      address: {
        street: rows[0].street,
        city:   rows[0].city,
        zip:    rows[0].zip
      },
      items,
      grandTotal
    })
  } catch (err) {
    next(err)
  }
}
