# Shop Base API Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- pnpm or npm

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_NAME=shop_base

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m

# Refresh Token Configuration
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production
REFRESH_TOKEN_EXPIRATION=7d
REFRESH_TOKEN_EXPIRATION_MS=604800000

# Cookie Configuration
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Database Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create Database:**
   ```sql
   CREATE DATABASE shop_base;
   ```
3. **Update credentials** in your `.env` file

## Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Build the application:**

   ```bash
   pnpm run build
   # or
   npm run build
   ```

3. **Start the application:**
   ```bash
   pnpm run start:dev
   # or
   npm run start:dev
   ```

## API Endpoints

Once running, your API will be available at:

- **Base URL:** `http://localhost:3000`
- **Swagger Documentation:** `http://localhost:3000/api`

### Authentication Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login with credentials
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and revoke tokens

## Testing the API

1. **Start the application**
2. **Open Swagger UI** at `http://localhost:3000/api`
3. **Test the endpoints** using the interactive documentation

## Common Issues & Solutions

### 1. Database Connection Error

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database `shop_base` exists

### 2. JWT Secret Error

- Ensure `JWT_SECRET` is set in `.env`
- Use a strong, unique secret key

### 3. Port Already in Use

- Change `PORT` in `.env` file
- Or kill the process using the current port

### 4. Missing Dependencies

- Run `pnpm install` or `npm install`
- Clear `node_modules` and reinstall if needed

## Development

- **Watch mode:** `pnpm run start:dev`
- **Build:** `pnpm run build`
- **Lint:** `pnpm run lint`
- **Test:** `pnpm run test`

## Production

- **Build:** `pnpm run build`
- **Start:** `pnpm run start:prod`
- **Environment:** Set `NODE_ENV=production`
- **Secure secrets:** Use strong, unique secrets for production
