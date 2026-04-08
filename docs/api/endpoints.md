# Microservices Go gRPC -- Service Endpoints

## UserService (port 50051)

### `CreateUser`
Create a new user account.

**Request (`CreateUserRequest`):**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full name |
| `email` | string | Email address (unique) |

**Response (`CreateUserResponse`):**
| Field | Type | Description |
|-------|------|-------------|
| `user` | User | Created user object with generated `id` |

### `GetUser`
Retrieve a user by ID.

**Request:** `{ "id": "string" }`
**Response:** `{ "user": { "id": "...", "name": "...", "email": "...", "created_at": "..." } }`
**Errors:** `NOT_FOUND` if the user does not exist.

### `ListUsers`
List users with pagination.

**Request:** `{ "page_size": 20, "page_token": "" }`
**Response:** `{ "users": [...], "next_page_token": "..." }`

## OrderService (port 50052)

### `CreateOrder`
Create a new order with line items.

**Request (`CreateOrderRequest`):**
| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | ID of the ordering user |
| `items` | repeated LineItem | `{ product_id, quantity, unit_price }` |

**Response:** `{ "order": { "id": "...", "user_id": "...", "items": [...], "total": 89.97, "status": "PENDING" } }`
**Errors:** `INVALID_ARGUMENT` if `items` is empty.

### `GetOrder`
Retrieve an order by ID.

**Request:** `{ "id": "string" }`
**Response:** Full order object with nested items.
**Errors:** `NOT_FOUND` if the order does not exist.

### `UpdateOrderStatus`
Transition an order to the next status.

**Request:** `{ "id": "string", "status": "CONFIRMED" | "SHIPPED" | "DELIVERED" }`
**Errors:** `FAILED_PRECONDITION` on invalid status transitions.

## InventoryService (port 50053)

### `CheckStock`
Check available stock for a product.

**Request:** `{ "product_id": "string" }`
**Response:** `{ "product_id": "...", "available": 42 }`

### `ReserveStock`
Reserve inventory for an order. Called during order creation.

**Request:** `{ "items": [{ "product_id": "...", "quantity": 2 }] }`
**Response:** `{ "reservation_id": "...", "expires_at": "..." }`

## Common Error Codes
| gRPC Code | When |
|-----------|------|
| `NOT_FOUND` | Entity does not exist |
| `INVALID_ARGUMENT` | Malformed or missing required fields |
| `FAILED_PRECONDITION` | Invalid state transition |
| `UNAUTHENTICATED` | Missing or expired auth metadata |

## Authentication
All RPCs require a `authorization` metadata key with a valid JWT. The gateway validates tokens and injects `x-user-id` metadata for downstream services.
