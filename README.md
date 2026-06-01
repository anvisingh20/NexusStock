# NexusStock: Inventory & Order Management System

NexusStock is a full-stack, enterprise-grade web application designed for real-time inventory tracking, customer profiling, order processing, and transactional stock safety. It features a modern FastAPI backend backed by SQLAlchemy, a beautiful dark-mode React Single Page Application (SPA) utilizing modern vanilla CSS glassmorphism, and a Postgres database orchestrator.

---

## 🌟 Key Features

* **Real-time System Dashboard:** Live trackers displaying total products, customers, order volumes, and automated warning indicators for low stock levels.
* **Product Catalog (CRUD):** Custom register specifications, strict unique SKU checks, unit price validation (> 0), and initial stock levels.
* **Customer Registry (CRUD):** Structured customer databases with custom email format verifications and uniqueness validations.
* **Order Transaction Center:** Staged Cart Composer to compile invoices for customers with live price and quantity calculations. Blocks orders if stock levels are insufficient.
* **Database Transaction Safety:** Employs SQLAlchemy transactions ensuring any failures during multi-item ordering perform automatic rollbacks.
* **Refill Quick Actions:** Ability to quickly increment or overwrite warehouse stock counts directly from the inventory dashboard.
* **Auditable Invoice Logs:** Interactive logs with detailed drawers showing item breakdown, unit prices, and a "Cancel Invoice" stock restorer.

---

## 🛠 Technology Stack

| Layer | Technology | Description |
| --- | --- | --- |
| **Frontend** | React.js (Vite) | Single Page App with Google Fonts & Lucide Icons |
| **Styling** | Modern Vanilla CSS | Customized HSL, backdrop filters, animations, flex-grids |
| **Backend** | FastAPI (Python) | High-performance async REST API, auto-docs |
| **Database** | PostgreSQL / SQLite | Multi-engine backend (SQLAlchemy ORM) |
| **Containerization** | Docker | Clean, multi-stage optimized build layers |
| **Orchestration** | Docker Compose | Local multi-service system routing |

---

## 📦 File Architecture

```
├── backend/
│   ├── app/
│   │   ├── database.py      # SQLAlchemy connection & DB session manager
│   │   ├── models.py        # SQLAlchemy schema (Products, Customers, Orders, Items)
│   │   ├── schemas.py       # Pydantic validation models
│   │   ├── crud.py          # Transaction-safe database operations
│   │   └── main.py          # FastAPI application & router endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Dashboard, Products, Customers, Orders, Inventory
│   │   ├── App.jsx          # Main client router
│   │   ├── index.css        # Unified dark-mode glassmorphic stylesheet
│   │   └── main.jsx         # React application bootloader
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Running the Project

NexusStock supports two deployment methods: **Docker Compose (PostgreSQL)** and **Direct Local Launch (SQLite Fallback)**.

### Method 1: Direct Local Launch (SQLite - No Docker Required!)

This is the fastest way to run and test the project locally without needing a PostgreSQL server or Docker. The backend will automatically create an `inventory.db` SQLite file locally!

#### 1. Setup & Launch Backend
Navigate into the `backend/` folder, install requirements, and run with uvicorn:
```bash
# Move to backend
cd backend

# Create a virtual environment
python -m venv venv
# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI API server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API server will start at **`http://127.0.0.1:8000`**. You can inspect the interactive OpenAPI/Swagger documentation at **`http://127.0.0.1:8000/docs`**!

#### 2. Setup & Launch Frontend
Open a new terminal window, navigate into the `frontend/` folder, install npm modules, and boot Vite:
```bash
# Move to frontend
cd frontend

# Install package files
npm install

# Start Vite React server
npm run dev
```
The React frontend client will open at **`http://localhost:3000`** (or another port highlighted in your console)!

---

### Method 2: Containerized Run (Docker Compose + PostgreSQL)

If you have Docker installed, you can build and start all services (Frontend, Backend, and Postgres) with a single command.

```bash
# Start all containers in the root folder
docker-compose up --build
```
This command automatically:
* Pulls PostgreSQL 15 and boots it on port `5432` with a persistent storage mount.
* Builds the FastAPI server on port `8000`, connected to the database.
* Compiles the React + Vite static output and hosts it via Nginx on port `3000`.

Open **`http://localhost:3000`** to access the complete application!

---

## 📋 Core API Documentation

Detailed endpoints registered in the FastAPI server:

### Dashboard APIs
* `GET /dashboard/stats` - Fetches total counts and low stock warnings.

### Product Catalog APIs
* `POST /products` - Register a new product spec (requires unique SKU, price > 0, stock >= 0).
* `GET /products` - Read all product specs.
* `GET /products/{id}` - Inspect specific product.
* `PUT /products/{id}` - Update specifications.
* `DELETE /products/{id}` - Remove product.

### Customer Directory APIs
* `POST /customers` - Register customer profile (requires unique, valid email format).
* `GET /customers` - Read all profiles.
* `GET /customers/{id}` - Inspect customer details.
* `PUT /customers/{id}` - Update profile.
* `DELETE /customers/{id}` - Remove customer.

### Order Transaction APIs
* `POST /orders` - Creates an invoice order. Validates stock levels, decrements quantities, and computes totals inside an SQL transaction block.
* `GET /orders` - Read all order log entries.
* `GET /orders/{id}` - Fetch order items and customer data.
* `DELETE /orders/{id}` - Cancels the order, changing status to `Cancelled` and restoring inventory quantities back to warehouse stocks.
