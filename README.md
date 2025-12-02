# Fintrack Backend API

A standalone Node.js/Express backend API for the Fintrack financial management application with MongoDB and JWT authentication.

## Features

- 🔐 **JWT Authentication** with mobile OTP verification
- 📱 **Mobile-first** login system (Indian phone numbers)
- 💰 **Financial Data Management** (transactions, investments, goals)
- 🏅 **Precious Metals Tracking** (22K/24K gold, silver)
- 🎯 **Goal Management** with progress tracking
- 🔒 **Security** with rate limiting, CORS, and Helmet
- 📊 **MongoDB** with Mongoose ODM
- 🚀 **Production Ready** with proper error handling

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB connection string
```

### Development
```bash
# Start development server
npm run dev

# Server will run on http://localhost:5000
```

### Production
```bash
# Build the project
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fintrack

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://yourfrontend.com,https://yourapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication (Public)
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Transactions (Protected)
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Investments (Protected)
- `GET /api/investments` - Get all investments
- `POST /api/investments` - Create new investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment

### Goals (Protected)
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `GET /api/goals/:id/transactions` - Get goal transactions
- `POST /api/goals/:id/transactions` - Add goal transaction

### System
- `GET /health` - Health check
- `GET /` - API information

## Authentication Flow

1. **Send OTP**: `POST /api/auth/send-otp` with phone number
2. **Verify OTP**: `POST /api/auth/verify-otp` with phone + OTP (123456)
3. **Get JWT Token**: Use token in `Authorization: Bearer <token>` header
4. **Access Protected APIs**: All other endpoints require authentication

## Data Models

### User
```typescript
{
  phoneNumber: string;    // Indian mobile number (10 digits)
  name?: string;
  email?: string;
  isVerified: boolean;
}
```

### Transaction
```typescript
{
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: Date;
}
```

### Investment
```typescript
{
  type: 'gold' | 'silver';
  carat?: '22K' | '24K';  // Only for gold
  quantity: number;       // in grams
  pricePerUnit: number;
  totalAmount: number;
  date: Date;
}
```

### Goal
```typescript
{
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  icon: 'bike' | 'car' | 'home' | 'plane' | 'education' | 'wedding';
}
```

## Security Features

- **JWT Authentication** with 7-day expiry
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **Input Validation** with Mongoose schemas
- **Error Handling** with proper HTTP status codes

## Deployment

### Railway/Render/Vercel
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Manual Server
```bash
# Build and start
npm run build
npm start

# Or use PM2
npm install -g pm2
pm2 start dist/index-mongodb.js --name fintrack-api
```

## Testing

### Using cURL
```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210", "otp": "123456"}'

# Use JWT token for protected endpoints
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Development Notes

- **OTP is fixed to 123456** for development
- **Phone number validation** for Indian numbers (6-9 prefix)
- **MongoDB indexes** for better query performance
- **Graceful error handling** with proper HTTP status codes
- **Request logging** for debugging

## Support

For issues and questions:
1. Check the logs: `npm run dev` shows detailed error messages
2. Verify MongoDB connection string
3. Ensure all environment variables are set
4. Check CORS settings for frontend integration

## License

MIT License - see LICENSE file for details.