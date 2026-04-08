const { UserModel, validateUserInput } = require('../../src/models/user');
const { OrderModel, computeOrderTotal } = require('../../src/models/order');
const { encodeProtobuf, decodeProtobuf } = require('../../src/proto-helpers');
const { ServiceRegistry } = require('../../src/registry');

describe('User Model', () => {
  it('should create a user with generated ID and timestamps', () => {
    const user = UserModel.create({ name: 'Alice', email: 'alice@test.com' });
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('should validate required fields', () => {
    const result = validateUserInput({ name: '', email: 'a@b.com' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('should reject invalid email format', () => {
    const result = validateUserInput({ name: 'Test', email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('should accept valid input', () => {
    const result = validateUserInput({ name: 'Alice', email: 'alice@test.com' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Order Model', () => {
  it('should compute total from line items', () => {
    const items = [
      { productId: 'p1', quantity: 2, unitPrice: 10.0 },
      { productId: 'p2', quantity: 1, unitPrice: 25.5 },
    ];
    expect(computeOrderTotal(items)).toBeCloseTo(45.5);
  });

  it('should return 0 for an empty items list', () => {
    expect(computeOrderTotal([])).toBe(0);
  });

  it('should create an order with PENDING status', () => {
    const order = OrderModel.create({
      userId: 'u1',
      items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }],
    });
    expect(order.status).toBe('PENDING');
    expect(order.id).toBeDefined();
    expect(order.total).toBe(10);
  });

  it('should transition order status correctly', () => {
    const order = OrderModel.create({
      userId: 'u1',
      items: [{ productId: 'p1', quantity: 1, unitPrice: 5 }],
    });
    OrderModel.confirm(order);
    expect(order.status).toBe('CONFIRMED');
    OrderModel.ship(order);
    expect(order.status).toBe('SHIPPED');
  });

  it('should reject invalid status transitions', () => {
    const order = OrderModel.create({
      userId: 'u1',
      items: [{ productId: 'p1', quantity: 1, unitPrice: 5 }],
    });
    expect(() => OrderModel.ship(order)).toThrow('Cannot ship a PENDING order');
  });
});

describe('Protobuf Helpers', () => {
  it('should encode and decode a user message', () => {
    const original = { id: 'u1', name: 'Alice', email: 'alice@test.com' };
    const buffer = encodeProtobuf('User', original);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    const decoded = decodeProtobuf('User', buffer);
    expect(decoded).toEqual(original);
  });

  it('should handle nested message types (Order with items)', () => {
    const original = {
      id: 'o1',
      userId: 'u1',
      items: [{ productId: 'p1', quantity: 2, unitPrice: 15.0 }],
      total: 30.0,
      status: 'PENDING',
    };
    const buffer = encodeProtobuf('Order', original);
    const decoded = decodeProtobuf('Order', buffer);
    expect(decoded.items).toHaveLength(1);
    expect(decoded.total).toBeCloseTo(30.0);
  });
});

describe('ServiceRegistry', () => {
  it('should register and discover services by name', () => {
    const registry = new ServiceRegistry();
    registry.register('user-service', 'localhost:50051');
    registry.register('order-service', 'localhost:50052');
    expect(registry.discover('user-service')).toBe('localhost:50051');
  });

  it('should throw when discovering an unregistered service', () => {
    const registry = new ServiceRegistry();
    expect(() => registry.discover('unknown')).toThrow('Service "unknown" not found');
  });

  it('should deregister a service', () => {
    const registry = new ServiceRegistry();
    registry.register('svc', 'localhost:5000');
    registry.deregister('svc');
    expect(() => registry.discover('svc')).toThrow();
  });
});
