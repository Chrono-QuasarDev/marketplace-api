# Marketplace API

This project implements a single-item marketplace API for user accounts, products, order purchases, and product reviews.

Base URL:

- /api

Authentication:

- Most routes require a bearer token in the Authorization header.
- Example: Authorization: Bearer <token>

## Authentication

### POST /api/auth/signup
Creates a new user account.

Request body:

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

Success response (201):

```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

### POST /api/auth/login
Logs in an existing user and returns a token.

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Success response (200):

```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "buyer"
  },
  "token": "jwt-token"
}
```

---

## Users

### GET /api/users/profile
Returns the authenticated user profile.

Authentication required: yes

Success response (200):

```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "buyer"
}
```

### PUT /api/users/profile
Updates the authenticated user's username.

Authentication required: yes

Request body:

```json
{
  "username": "newusername"
}
```

Success response (200):

```json
{
  "user": {
    "id": "uuid",
    "username": "newusername",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

---

## Products

### POST /api/products
Creates a new product listing.

Authentication required: yes

Allowed role: seller

Request body:

```json
{
  "title": "Used bicycle",
  "description": "Good condition mountain bike",
  "price": 250,
  "category": "vehicles",
  "images": ["bike-1.jpg", "bike-2.jpg"],
  "availability": true
}
```

Success response (201):

```json
{
  "id": "uuid",
  "sellerId": "uuid",
  "title": "Used bicycle",
  "description": "Good condition mountain bike",
  "price": 250,
  "category": "vehicles",
  "images": ["bike-1.jpg", "bike-2.jpg"],
  "availability": true,
  "createdAt": "2026-08-17T00:00:00.000Z",
  "updatedAt": "2026-08-17T00:00:00.000Z"
}
```

### GET /api/products
Lists products with pagination, sorting, and default ordering.

Authentication required: yes

Allowed roles: buyer, seller, admin

Query parameters:

- page: numeric page number, default 1
- size: page size, default 10, max 100
- sortBy: createdAt | price | title, default createdAt
- orderBy: asc | desc, default desc

Example:

```http
GET /api/products?page=1&size=10&sortBy=price&orderBy=desc
```

Success response (200):

```json
{
  "data": [
    {
      "id": "uuid",
      "sellerId": "uuid",
      "title": "Used bicycle",
      "description": "Good condition mountain bike",
      "price": 250,
      "category": "vehicles",
      "images": ["bike-1.jpg"],
      "availability": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### GET /api/products/:id
Gets a single product by id.

Authentication required: yes for route access in this app

Success response (200):

```json
{
  "id": "uuid",
  "sellerId": "uuid",
  "title": "Used bicycle",
  "description": "Good condition mountain bike",
  "price": 250,
  "category": "vehicles",
  "images": ["bike-1.jpg"],
  "availability": true
}
```

### PUT /api/products/:id
Updates a product.

Authentication required: yes

Allowed role: seller

Only the product owner may update their listing.

Request body example:

```json
{
  "price": 220,
  "availability": false
}
```

Success response (200):

```json
{
  "id": "uuid",
  "sellerId": "uuid",
  "title": "Used bicycle",
  "description": "Good condition mountain bike",
  "price": 220,
  "category": "vehicles",
  "images": ["bike-1.jpg"],
  "availability": false
}
```

### DELETE /api/products/:id
Deletes a product.

Authentication required: yes

Allowed role: seller

Success response (200):

```json
{
  "message": "Product deleted successfully"
}
```

---

## Orders

### POST /api/orders/purchase
Creates a new purchase order for a product.

Authentication required: yes

Allowed role: buyer

Request body:

```json
{
  "productId": "uuid"
}
```

Success response (201):

```json
{
  "order": {
    "id": "uuid",
    "buyerId": "uuid",
    "productId": "uuid",
    "priceAtPurchase": 250,
    "status": "pending",
    "createdAt": "2026-08-17T00:00:00.000Z",
    "updatedAt": "2026-08-17T00:00:00.000Z"
  }
}
```

Notes:

- A buyer cannot purchase their own product.
- The product must be available.
- Product availability is set to false when purchased.

### GET /api/orders
Gets the authenticated user's order history.

Authentication required: yes

Allowed roles: buyer, seller, admin

Success response (200):

```json
{
  "orders": [
    {
      "id": "uuid",
      "buyerId": "uuid",
      "productId": "uuid",
      "priceAtPurchase": 250,
      "status": "pending",
      "Product": {
        "id": "uuid",
        "sellerId": "uuid",
        "title": "Used bicycle",
        "price": 250,
        "category": "vehicles",
        "availability": false
      }
    }
  ]
}
```

### GET /api/orders/:id
Gets a single order by id.

Authentication required: yes

Allowed roles: buyer, seller, admin

Success response (200):

```json
{
  "order": {
    "id": "uuid",
    "buyerId": "uuid",
    "productId": "uuid",
    "priceAtPurchase": 250,
    "status": "pending",
    "Product": {
      "id": "uuid",
      "sellerId": "uuid",
      "title": "Used bicycle",
      "description": "Good condition mountain bike",
      "price": 250,
      "category": "vehicles",
      "availability": false
    }
  }
}
```

### PATCH /api/orders/:id
Updates an order status.

Authentication required: yes

Allowed roles: seller, admin

Request body:

```json
{
  "status": "processing"
}
```

Allowed order statuses:

- pending
- processing
- shipped
- delivered
- cancelled

Success response (200):

```json
{
  "order": {
    "id": "uuid",
    "buyerId": "uuid",
    "productId": "uuid",
    "priceAtPurchase": 250,
    "status": "processing"
  }
}
```

---

## Reviews

### POST /api/reviews
Creates a product review for a delivered order.

Authentication required: yes

Allowed role: buyer

Request body:

```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Great product, arrived fast."
}
```

Rules:

- the buyer must have purchased the product
- the order must be in delivered status
- a buyer can only review a product once
- rating must be between 1 and 5

Success response (201):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "productId": "uuid",
  "rating": 5,
  "comment": "Great product, arrived fast.",
  "createdAt": "2026-08-17T00:00:00.000Z",
  "updatedAt": "2026-08-17T00:00:00.000Z"
}
```

### GET /api/reviews/:id
Gets reviews for a product.

Authentication required: yes

The route takes a product id in the path.

Query parameters:

- rating: numeric filter between 1 and 5
- sortBy: createdAt | rating, default createdAt
- orderBy: asc | desc, default desc
- page: page number, default 1
- size: page size, default 10, max 100

Examples:

```http
GET /api/reviews/8d0acbfa-5f7d-4cf2-8e6a-987f7f1b2d1a
GET /api/reviews/8d0acbfa-5f7d-4cf2-8e6a-987f7f1b2d1a?rating=5&sortBy=rating&orderBy=desc&page=1&size=10
```

Without query parameters, the response is a plain array:

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "productId": "uuid",
    "rating": 5,
    "comment": "Great product, arrived fast.",
    "createdAt": "2026-08-17T00:00:00.000Z",
    "updatedAt": "2026-08-17T00:00:00.000Z",
    "User": {
      "id": "uuid",
      "username": "johndoe"
    }
  }
]
```

With query parameters, the response shape is:

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "rating": 5,
      "comment": "Great product, arrived fast.",
      "User": {
        "id": "uuid",
        "username": "johndoe"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### PUT /api/reviews/:id
Updates a review.

Authentication required: yes

Only the review owner may update their review.

Request body example:

```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

Success response (200):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "productId": "uuid",
  "rating": 4,
  "comment": "Updated comment"
}
```

### DELETE /api/reviews/:id
Deletes a review.

Authentication required: yes

Allowed roles: buyer, admin

A buyer can delete only their own review. Admins can delete any review.

Success response (200):

```json
{
  "message": "Review deleted successfully"
}
```

---

## Error responses

The API returns structured JSON errors for known application-level errors.

Examples:

```json
{
  "error": "Invalid product ID"
}
```

Common statuses:

- 400: invalid input or bad id format
- 401: unauthenticated request
- 403: forbidden action or unauthorized access
- 404: item not found
- 409: duplicate review or conflict
- 500: unexpected server error

---

## Role summary

- buyer: can buy products, view own orders, leave reviews, update own reviews, delete own reviews
- seller: can create/update/delete products, update order status for their sold items
- admin: can access and manage orders/reviews as needed by the implementation
