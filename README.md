# Projektbedömning

---

## ✅ Uppfyllda krav

### **2.1 Main Page / Home Page**
- Enkel startsida finns — [`home/index.ejs`](vscode-file://vscode-app/c:/Users/Danne/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)  
- Navigation med **Login** och **Register** i header — [`default.ejs`](vscode-file://vscode-app/c:/Users/Danne/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

---

### **2.2 Register Page**
- Registreringsformulär med alla fält:
  - ✅ First Name, Last Name  
  - ✅ Address, City, Zip code  
  - ✅ Phone number  
  - ✅ Email (unique)  
  - ✅ Password (krypterat med **bcrypt**)  
- Validering implementerad (`validators.js` - email, zip, password-längd)  
- Duplicate email prevention (**ER_DUP_ENTRY** hantering)  
- Success-meddelande visas efter registrering

---

### **2.3 Login Page**
- ✅ Login-formulär med email och password  
- ✅ Input validation implementerad  
- ✅ Felmeddelanden visas korrekt  

---

### **2.4 Search for Books**
- ✅ Visar användarnamn när inloggad  
- ✅ Log out-knapp synlig  
- ✅ Subject-filtrering implementerad  
- ✅ Author search: `LIKE` med `toLowerCase() + '%'` *(starts with, case-insensitive)*  
- ✅ Title search: `LIKE` med `'%' + toLowerCase() + '%'` *(contains, case-insensitive)*  
- ✅ Pagination: `LIMIT / OFFSET` korrekt implementerad (5 böcker per sida)  
- ✅ Meddelande när inga böcker hittas  
- ✅ “Add to cart” med quantity-input  
- ✅ Uppdaterar quantity om bok redan finns i cart  

---

### **2.5 View Cart**
- ✅ Visar **ISBN**, **Title**, **Price**, **Quantity**, **Total**  
- ✅ Grand Total beräknas korrekt  

---

### **2.6 Checkout**
- ✅ Order invoice genereras och visas  
- ✅ Order date (**created date**)  
- ✅ Delivery date (7 dagar framåt — `DELIVERY_DAYS` konstant)  
- ✅ Delivery address hämtas från `members`-tabellen  
- ✅ Sparar i `order`-tabellen  
- ✅ Sparar i `order_details`-tabellen med **ISBN**, **qty**, **amount**  

---

### **2.7 Log Out**
- ✅ Session destroy implementerad  
- ✅ Redirect till home page  

---

## 🎯 Sammanfattning

Ja, ditt projekt **uppfyller alla krav i uppgiften**!

### **Extra styrkor**
- ✅ **Clean Code**: Refaktorerad kod med tydlig *separation of concerns*  
- ✅ **Tester**: 41 enhetstester (går utöver kraven)  
- ✅ **Validators**: Återanvändbara valideringsfunktioner  

### Notera!!

Eftersom Zip-code är en INT så kan det svenska sättet att skriva postnummer med mellanslag ge problem, dvs "XXX XX" måste skrivas "XXXXX"
