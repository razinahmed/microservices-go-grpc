<div align="center">

<img src="https://placehold.co/900x250/0d1117/00add8?text=Microservices+Go+gRPC&font=montserrat" alt="Microservices Go gRPC Banner" width="100%" />

# Microservices Go gRPC

**Scalable Go microservices architecture using gRPC and Protocol Buffers — service mesh, auth interceptors, health checks, and distributed tracing for high-performance backend systems**

[![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![gRPC](https://img.shields.io/badge/gRPC-244c5a?style=for-the-badge&logo=google&logoColor=white)](https://grpc.io/)
[![Protocol Buffers](https://img.shields.io/badge/Protobuf-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://protobuf.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [API Reference](#-api-reference) · [Contributing](#-contributing) · [License](#-license)

</div>

---

## Overview

A production-ready Go microservices template demonstrating idiomatic gRPC service design with Protocol Buffers. The architecture includes authentication interceptors, health check endpoints, structured logging, and distributed tracing — all containerized with multi-stage Docker builds and orchestrated via Makefile automation.

## Features

| Feature | Description |
|---------|-------------|
| **gRPC Services** | High-performance RPC services with streaming and unary calls |
| **Proto Definitions** | Strongly-typed service contracts using Protocol Buffers v3 |
| **Auth Interceptor** | JWT-based authentication middleware for gRPC calls |
| **Health Checks** | gRPC health checking protocol for load balancer integration |
| **Service Mesh Ready** | Compatible with Istio, Linkerd, and Consul Connect |
| **Distributed Tracing** | OpenTelemetry integration for end-to-end request tracing |
| **Docker Multi-stage** | Optimized container images with minimal runtime footprint |
| **Makefile Automation** | Single-command build, test, lint, and proto generation |

## Tech Stack

<div align="center">

| Technology | Purpose |
|:----------:|:-------:|
| ![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white) | Language |
| ![gRPC](https://img.shields.io/badge/gRPC-244c5a?style=flat-square&logo=google&logoColor=white) | RPC Framework |
| ![Protobuf](https://img.shields.io/badge/Protobuf-4285F4?style=flat-square&logo=google&logoColor=white) | Serialization |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | Containerization |
| ![Make](https://img.shields.io/badge/Make-427819?style=flat-square&logo=gnu&logoColor=white) | Build Automation |

</div>

## Getting Started

### Prerequisites

- [Go](https://go.dev/dl/) >= 1.21
- [Protocol Buffers Compiler](https://grpc.io/docs/protoc-installation/) >= 3.25
- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Make](https://www.gnu.org/software/make/) >= 4.0
- [grpcurl](https://github.com/fullstorydev/grpcurl) (optional, for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/razinahmed/microservices-go-grpc.git
cd microservices-go-grpc

# Install Go dependencies
go mod download

# Generate protobuf code
make proto

# Build all services
make build
```

### Quickstart

```bash
# Run all services with Docker Compose
make docker-up

# Or run individual services locally
make run-user-service
make run-order-service

# Test with grpcurl
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext -d '{"id": "1"}' localhost:50051 user.UserService/GetUser

# Run tests
make test
```

## Project Structure

```
microservices-go-grpc/
├── proto/
│   ├── user/
│   │   └── user.proto            # User service definitions
│   ├── order/
│   │   └── order.proto           # Order service definitions
│   └── health/
│       └── health.proto          # Health check protocol
├── services/
│   ├── user/
│   │   ├── cmd/
│   │   │   └── main.go          # User service entry point
│   │   ├── handler/
│   │   │   └── user.go          # gRPC handler implementations
│   │   ├── repository/
│   │   │   └── user.go          # Data access layer
│   │   └── Dockerfile           # Multi-stage build
│   └── order/
│       ├── cmd/
│       │   └── main.go          # Order service entry point
│       ├── handler/
│       │   └── order.go         # gRPC handler implementations
│       ├── repository/
│       │   └── order.go         # Data access layer
│       └── Dockerfile           # Multi-stage build
├── pkg/
│   ├── interceptor/
│   │   ├── auth.go              # JWT auth interceptor
│   │   └── logging.go           # Request logging interceptor
│   ├── health/
│   │   └── health.go            # Health check implementation
│   └── tracing/
│       └── otel.go              # OpenTelemetry setup
├── gen/                          # Generated protobuf Go code
├── docker-compose.yml            # Service orchestration
├── Makefile                      # Build automation
├── go.mod
├── go.sum
└── README.md
```

## API Reference

### User Service (port 50051)

```protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc UpdateUser (UpdateUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  google.protobuf.Timestamp created_at = 4;
}
```

### Order Service (port 50052)

```protobuf
service OrderService {
  rpc GetOrder (GetOrderRequest) returns (Order);
  rpc CreateOrder (CreateOrderRequest) returns (Order);
  rpc ListOrders (ListOrdersRequest) returns (stream Order);
}

message Order {
  string id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;
  OrderStatus status = 4;
}
```

### Auth Interceptor Usage

```go
import "github.com/razinahmed/microservices-go-grpc/pkg/interceptor"

server := grpc.NewServer(
    grpc.UnaryInterceptor(interceptor.AuthUnary(jwtSecret)),
    grpc.StreamInterceptor(interceptor.AuthStream(jwtSecret)),
)
```

### Health Check

```bash
# Check service health via gRPC
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# Response
# { "status": "SERVING" }
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make proto` | Generate Go code from .proto files |
| `make build` | Build all service binaries |
| `make test` | Run all tests with coverage |
| `make lint` | Run golangci-lint |
| `make docker-build` | Build Docker images for all services |
| `make docker-up` | Start all services via Docker Compose |
| `make docker-down` | Stop all services |
| `make clean` | Remove build artifacts and generated code |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-service`)
3. Commit your changes (`git commit -m 'feat: add new gRPC service'`)
4. Push to the branch (`git push origin feature/new-service`)
5. Open a Pull Request

Please ensure your code passes `make lint` and `make test` before submitting.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with passion by [Razin Ahmed](https://github.com/razinahmed)**

`Go` · `Golang` · `gRPC` · `Microservices` · `Protocol Buffers` · `Service Mesh` · `Backend Architecture`

</div>
