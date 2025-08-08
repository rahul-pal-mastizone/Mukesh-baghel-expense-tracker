# Mukesh Baghel Expense Tracker

This project was developed as a **commissioned solution for a client** — Mukesh Baghel — to help manage and track expenses across multiple warehouses.  
It is an **offline-first, browser-based web application** requiring **no backend or server**.

---

## 📋 Project Overview
The **Mukesh Baghel Expense Tracker** enables the client to:
- Maintain and organize multiple warehouses/suppliers
- Log purchases with product details, amount spent, and due amounts
- View complete purchase history for each warehouse
- Import and export records in CSV format for Excel-friendly data handling
- Store all records locally in the browser (LocalStorage), ensuring access even without internet

---

## 🎯 Client Requirements Fulfilled
- **Warehouse Management:** Add, edit, and delete warehouses
- **Purchase Records:** Track spending, due amounts, dates, and product names
- **CSV Export:** Excel-safe date formatting to prevent “########” display errors
- **CSV Import:** Auto-create warehouses when importing from properly formatted CSV files
- **Responsive Design:** Optimized for desktop, tablet, and mobile
- **Brand Personalization:** Displays the client’s store name, founder, address, and contact details with an image at the top

---

## 🛠 Tech Stack
- **Frontend:** HTML5, CSS3, Bootstrap 5
- **Logic:** Vanilla JavaScript (ES6+)
- **Data Storage:** Browser LocalStorage
- **File Handling:** CSV parsing and formatting in JavaScript

---

## 📂 Project Structure
Mukesh_Baghel_Expense_Tracker/
├── index.html # Main HTML layout
├── styles.css # Custom CSS styling
├── app.js # Core logic and event handling
├── assets/
│ └── owner.png # Client’s store image/logo
└── README.md # Project documentation


---

## 🚀 Usage Instructions
1. **Open** `index.html` in any modern web browser.
2. **Add warehouses** using the “Add Warehouse” button.
3. **Log purchases** by selecting a warehouse, entering purchase details, and clicking “Add Expense”.
4. **View history** by clicking a warehouse row in the table.
5. **Export data** to CSV for backup or sharing.
6. **Import data** from CSV to update or restore records.

---

## 📦 CSV File Format
| Warehouse        | Product Name | Amount Spent | Due Amount | Purchase Date |
|------------------|--------------|--------------|------------|---------------|
| Rahul Shop       | Shoes 1      | 4500         | 500        | 2025-08-01    |
| Ankur Maheshwari | Project 2    | 5000         | 200        | 2025-08-03    |

- **Date Format:** `YYYY-MM-DD` (exported as Excel text to avoid auto-format issues)

---

## 👤 Client Branding
At the top of the application, the client’s branding is displayed:
- Store Name
- Founder Name
- Address
- Contact Number
- Store Image / Logo

---

## 📄 License
This project was developed as **private commissioned work** exclusively for the client.  
All rights are reserved by the client unless otherwise stated in writing.
