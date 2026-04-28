# Nexus Blockchain Core

A full-stack Blockchain Explorer and Analytics Platform built with React, Node.js, Express, and PostgreSQL. The platform provides wallet management, market and P2P trading, token conversions, transaction tracking, and a simulated blockchain explorer.


## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [License](#license)


## Features

- Blockchain explorer with block and transaction details
- Wallet management with balance tracking and token holdings
- Market trading with trading pairs, price history, and order books
- Peer-to-peer trading with order creation and transaction management
- Token conversion and swap functionality
- User registration and authentication with email verification
- Email notifications for transactions and account activity
- Search functionality for wallets and transactions
- Real-time analytics and statistics


## Tech Stack

**Frontend**

- React 19
- TypeScript
- Vite 8
- Tailwind CSS

**Backend**

- Node.js
- Express 5
- PostgreSQL
- Nodemailer

**Development Tools**

- Nodemon
- Concurrently
- ESLint


## Project Structure

```
Nexus-Blockchain-Core/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |   |-- ConnectDB.js
|   |   |-- controllers/
|   |   |   |-- blockController.js
|   |   |   |-- conversionController.js
|   |   |   |-- emailController.js
|   |   |   |-- marketController.js
|   |   |   |-- p2pController.js
|   |   |   |-- searchController.js
|   |   |   |-- tokenController.js
|   |   |   |-- transactionController.js
|   |   |   |-- userController.js
|   |   |   |-- walletController.js
|   |   |-- middleware/
|   |   |   |-- errorHandler.js
|   |   |-- routes/
|   |   |-- utils/
|   |   |   |-- asyncHandler.js
|   |   |   |-- emailService.js
|   |   |-- app.js
|   |   |-- server.js
|   |-- database-schema.sql
|   |-- package.json
|-- Frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- lib/
|   |   |-- store/
|   |   |-- types/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |-- public/
|   |-- index.html
|   |-- package.json
|   |-- vite.config.ts
|   |-- tsconfig.json
|-- package.json
|-- LICENSE
|-- README.md
```


## Prerequisites

- Node.js version 18 or higher
- PostgreSQL version 14 or higher
- npm or yarn package manager


## Installation

1. Clone the repository

```bash
git clone https://github.com/EbadAhmed1/Nexus-Blockchain-Core.git
cd Nexus-Blockchain-Core
```

2. Install all dependencies (root, backend, and frontend)

```bash
npm run install:all
```

Or install them individually

```bash
npm install
cd backend && npm install
cd ../Frontend && npm install
```


## Environment Variables

Create a `.env` file inside the `backend/` directory with the following variables:

```
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password_here
PG_DATABASE=blockscan
PORT=5000
```

Optional email configuration:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email
SMTP_PASS=your_password
EMAIL_FROM=noreply@example.com
FRONTEND_URL=http://localhost:5173
```


## Database Setup

1. Create the database in PostgreSQL

```sql
CREATE DATABASE blockscan;
```

2. Run the schema file to create tables, views, functions, and triggers

```bash
psql -U postgres -d blockscan -f backend/database-schema.sql
```

Or if using a migration file:

```bash
psql -U postgres -d blockscan -f backend/create-blockscan-database.sql
```


## Running the Application

Run both frontend and backend together from the project root:

```bash
npm run dev
```

This starts the backend on http://localhost:5000 and the frontend on http://localhost:5173.

To run them separately:

```bash
# Backend only
cd backend
npm run dev

# Frontend only
cd Frontend
npm run dev
```

To build the frontend for production:

```bash
npm run build
```


## API Endpoints

| Resource      | Base Path           | Description                              |
|---------------|---------------------|------------------------------------------|
| Users         | /api/users          | Registration, login, profile management  |
| Wallets       | /api/wallets        | Wallet creation, balances, transfers     |
| Blocks        | /api/blocks         | Block listing and details                |
| Transactions  | /api/transactions   | Transaction creation and history         |
| Tokens        | /api/tokens         | Token listing, details, and holders      |
| Market        | /api/market         | Trading pairs, price history, order book |
| P2P           | /api/p2p            | Peer-to-peer order and trade management  |
| Conversion    | /api/conversion     | Token swap and conversion rates          |
| Search        | /api/search         | Search wallets and transactions          |
| Email         | /api/email          | Notifications and verification           |


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
