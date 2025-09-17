# Shop Base - Spring Boot Application

A Spring Boot e-commerce backend application with JWT authentication, role-based access control, and product management.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Customer/Admin)
  - HttpOnly cookies for secure token storage
  - Refresh token mechanism

- **Product Management**
  - Full CRUD operations for products
  - Advanced filtering and search
  - Featured products, top-rated, and best-selling endpoints
  - Admin-only product management

- **Database**
  - PostgreSQL integration
  - JPA/Hibernate ORM
  - Automatic schema updates

- **API Documentation**
  - Swagger/OpenAPI 3 integration
  - Comprehensive API documentation

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+
- Node.js (for frontend development)

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE shop_base;
```

### 2. Environment Variables

Create a `.env` file in the project root (optional):

```env
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Build and Run

```bash
# Build the project
mvn clean compile

# Run the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### 4. API Documentation

Access Swagger UI at: `http://localhost:8080/swagger-ui.html`

## API Endpoints

### Authentication

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get current user profile

### Products (Public)

- `GET /products` - Get all products with filters
- `GET /products/{id}` - Get product by ID
- `GET /products/categories` - Get all categories
- `GET /products/brands` - Get all brands
- `GET /products/featured` - Get featured products
- `GET /products/top-rated` - Get top-rated products
- `GET /products/best-selling` - Get best-selling products

### Products (Admin Only)

- `POST /products` - Create new product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `PATCH /products/{id}/stock` - Update product stock

## Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Encrypted)
- `full_name` (String)
- `role` (Enum: CUSTOMER, ADMIN)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Products Table

- `id` (UUID, Primary Key)
- `name` (String)
- `description` (Text)
- `price` (Decimal)
- `stock` (Integer)
- `sku` (String)
- `category` (String)
- `brand` (String)
- `images` (JSON String)
- `specifications` (JSON String)
- `rating` (Decimal)
- `review_count` (Integer)
- `is_active` (Boolean)
- `is_featured` (Boolean)
- `sale_price` (Decimal)
- `sale_start_date` (Date)
- `sale_end_date` (Date)
- `weight` (String)
- `dimensions` (String)
- `color` (String)
- `size` (String)
- `view_count` (Integer)
- `sold_count` (Integer)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Refresh Tokens Table

- `id` (UUID, Primary Key)
- `token` (String)
- `user_id` (UUID, Foreign Key)
- `expires_at` (Timestamp)
- `is_revoked` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **HttpOnly Cookies**: Tokens stored in secure HttpOnly cookies
- **Role-based Access Control**: Admin and Customer roles
- **Password Encryption**: BCrypt password hashing
- **CORS Configuration**: Configurable cross-origin resource sharing

## Development

### Project Structure

```
src/
├── main/
│   ├── java/com/shopbase/
│   │   ├── controller/     # REST controllers
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── entity/        # JPA entities
│   │   ├── repository/    # Data repositories
│   │   ├── security/      # Security configuration
│   │   ├── service/       # Business logic
│   │   └── util/          # Utility classes
│   └── resources/
│       └── application.yml # Configuration
└── test/                  # Test files
```

### Testing

```bash
# Run tests
mvn test

# Run with coverage
mvn test jacoco:report
```

## Deployment

### Production Configuration

1. Update `application.yml` for production:
   - Set `spring.jpa.hibernate.ddl-auto` to `validate`
   - Configure production database
   - Set secure JWT secret
   - Enable HTTPS

2. Build for production:

```bash
mvn clean package -Pprod
```

3. Run the JAR:

```bash
java -jar target/shop-base-spring-1.0-SNAPSHOT.jar
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
