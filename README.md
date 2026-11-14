# VibeTalk Backend

**VibeTalk** is a real-time messaging application backend built with Node.js, Express.js, PostgreSQL, and Socket.IO. It provides REST API services, user authentication, database management, and real-time communication for the VibeTalk frontend.

**Frontend Repository:** [vibetalk-frontend](https://github.com/bitamez/vibetalk-frontend)

**Backend Repository:** [vibetalk-backend](https://github.com/bitamez/vibetalk-backend)

---

## 🚀 Features

- User registration and login
- JWT-based authentication
- Password hashing and secure credential handling
- PostgreSQL database integration
- Real-time messaging with Socket.IO
- Online user connection management
- RESTful API architecture
- Input validation and error handling
- Protected API routes
- Database connection pooling

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| PostgreSQL | Relational database |
| Supabase | Managed PostgreSQL hosting |
| Socket.IO | Real-time communication |
| JSON Web Token | Authentication |
| Zod | Data validation |
| bcrypt | Password hashing |
| dotenv | Environment configuration |
| Nodemon | Development server |

## 📁 Project Structure

```text
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   └── auth-controller.js
│
├── middleware/
│   └── Authentication middleware
│
├── routes/
│   └── API routes
│
├── services/
│   └── auth-service.js
│
├── sockets/
│   └── Socket.IO handlers
│
├── utils/
│   └── Utility functions
│
├── validators/
│   └── Zod schemas
│
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

*The structure above describes the intended organization. Adjust folder and filename entries to match the actual repository.*

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/bitamez/vibetalk-backend.git
```

### 2. Navigate to the project

```bash
cd vibetalk-backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the backend root directory.

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_strong_jwt_secret

CLIENT_URL=http://localhost:5173
```

**Important:** Never upload your `.env` file, database password, JWT secret, or other private credentials to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Expected output:

```text
PostgreSQL connected successfully
VibeTalk server running on port 5000
API: http://localhost:5000
Socket.IO is ready
```

## 🗄️ Database Configuration

VibeTalk uses PostgreSQL as its relational database.

The database connection is managed through a PostgreSQL connection pool using the `pg` package.

Example:

```javascript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
```

The application uses Supabase PostgreSQL for managed database hosting.

## 🔐 Authentication Workflow

VibeTalk uses JWT-based authentication.

The authentication workflow:

1. User submits registration details.
2. Express receives the registration request.
3. Input data is validated.
4. Password is securely hashed.
5. User information is stored in PostgreSQL.
6. User submits login credentials.
7. Backend verifies the credentials.
8. JWT authentication token is generated.
9. Authenticated user accesses protected routes.

## 💬 Real-Time Communication

Socket.IO provides real-time communication between connected users.

The backend supports:

- Socket connections
- User connection tracking
- Real-time event communication
- Online presence management
- Real-time messaging integration

The frontend connects to the backend Socket.IO server to exchange real-time events.

## 🔄 Backend Architecture

The application follows a layered architecture inspired by MVC.

```text
Client (React Frontend)
        |
        v
Express API Routes
        |
        v
Middleware
        |
        v
Controllers
        |
        v
Services
        |
        v
PostgreSQL Database
```

**Architecture responsibilities:**

- Routes: Define API endpoints.
- Middleware: Handle authentication and request processing.
- Controllers: Handle incoming requests and responses.
- Services: Implement business logic.
- Database: Store and retrieve application data.
- Socket.IO: Handle real-time communication.

## 🌐 Deployment

The backend is designed for deployment using Render.

**Deployment configuration:**

| Setting | Value |
|---|---|
| Repository | bitamez/vibetalk-backend |
| Platform | Render |
| Runtime | Node.js |
| Build Command | `npm install` |
| Start Command | `npm start` (if configured in package.json) |
| Database | Supabase PostgreSQL |

Configure production environment variables in Render:

```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-frontend-domain.vercel.app
```

Ensure the server listens on the hosting provider's assigned port using:

```javascript
const PORT = process.env.PORT || 5000;
```

Configure Express CORS and Socket.IO CORS to allow your deployed frontend domain.

## 🧪 Testing

Start the development server:

```bash
npm run dev
```

Verify the following:

- Database connection
- User registration
- User login
- JWT authentication
- Protected routes
- Socket.IO connection
- Real-time messaging

## 🔗 Related Repository

**VibeTalk Frontend:** https://github.com/bitamez/vibetalk-frontend

## 👨‍💻 Developer

Developed as a full-stack real-time messaging application using modern JavaScript technologies.

---

**VibeTalk Backend — Powering real-time conversations.**
