# System Architecture -- Microservices Go gRPC

## Overview
A polyglot microservices system built primarily in Go, communicating over gRPC with Protocol Buffers. Each service owns its data store and exposes a well-defined protobuf contract. An API gateway translates external REST/HTTP requests into gRPC calls.

## Services

### 1. API Gateway (Go, port 8080)
- Accepts HTTP/JSON requests from clients.
- Translates them into gRPC calls to internal services using generated client stubs.
- Handles JWT validation, rate limiting, and request logging.
- Uses gRPC client-side load balancing with round-robin policy.

### 2. UserService (Go, port 50051)
- Manages user accounts: registration, lookup, and listing.
- Stores data in PostgreSQL.
- Publishes `UserCreated` events to NATS for downstream consumers.

### 3. OrderService (Go, port 50052)
- Handles order creation, status transitions, and retrieval.
- Calls InventoryService to reserve stock before confirming an order.
- Uses a saga pattern for distributed transactions: if stock reservation fails, the order is cancelled.
- Stores data in PostgreSQL.

### 4. InventoryService (Go, port 50053)
- Manages product stock levels.
- Exposes `CheckStock` and `ReserveStock` RPCs.
- Reservations expire after 15 minutes if not confirmed, releasing the held quantity.
- Stores data in PostgreSQL with row-level locking for concurrent reservation safety.

## Communication
```
Client (HTTP) --> [API Gateway :8080]
                     |
         gRPC calls (protobuf)
           |            |              |
  [UserService]  [OrderService]  [InventoryService]
     :50051         :50052            :50053
       |               |                |
   [Postgres]      [Postgres]       [Postgres]
                       |
                  [NATS Pub/Sub]
```

- All inter-service communication uses gRPC over HTTP/2 with TLS in production.
- Protobuf definitions live in a shared `/proto` directory compiled at build time.
- Services use gRPC interceptors for logging, tracing (OpenTelemetry), and authentication propagation.

## Data Ownership
Each service owns a dedicated PostgreSQL database. There is no shared database. Cross-service data needs are resolved through gRPC calls or event-driven eventual consistency via NATS.

## Deployment
- Each service is compiled to a static Go binary and packaged in a distroless Docker image.
- Deployed to Kubernetes as individual Deployments with a ClusterIP Service each.
- Horizontal Pod Autoscaler scales based on gRPC request rate (custom metrics via Prometheus adapter).
- The API Gateway is exposed via an Ingress with TLS termination.

## Observability
- Structured JSON logging via `zap`.
- Distributed tracing with OpenTelemetry, exported to Jaeger.
- Prometheus metrics exposed on `/metrics` by each service, scraped by a central Prometheus instance.
- Grafana dashboards visualize latency percentiles, error rates, and throughput per service.

## Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_PORT` | `50051` | Listening port for gRPC server |
| `DB_URL` | (required) | PostgreSQL connection string |
| `NATS_URL` | `nats://localhost:4222` | NATS server URL |
| `JWT_SECRET` | (required) | Secret for JWT validation |
| `RESERVATION_TTL` | `15m` | Stock reservation expiry |
