const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.resolve(__dirname, '../../proto/services.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String });
const proto = grpc.loadPackageDefinition(packageDef).microservices;

let userClient;
let orderClient;

beforeAll(() => {
  const creds = grpc.credentials.createInsecure();
  userClient = new proto.UserService('localhost:50051', creds);
  orderClient = new proto.OrderService('localhost:50052', creds);
});

afterAll(() => {
  userClient.close();
  orderClient.close();
});

function promisify(client, method) {
  return (request) =>
    new Promise((resolve, reject) => {
      client[method](request, (err, response) => (err ? reject(err) : resolve(response)));
    });
}

describe('UserService gRPC Calls', () => {
  const getUser = (req) => promisify(userClient, 'GetUser')(req);
  const createUser = (req) => promisify(userClient, 'CreateUser')(req);

  it('should create a new user via gRPC', async () => {
    const res = await createUser({ name: 'Alice', email: 'alice@test.com' });
    expect(res.user.id).toBeDefined();
    expect(res.user.name).toBe('Alice');
    expect(res.user.email).toBe('alice@test.com');
  });

  it('should retrieve a user by ID', async () => {
    const created = await createUser({ name: 'Bob', email: 'bob@test.com' });
    const res = await getUser({ id: created.user.id });
    expect(res.user.name).toBe('Bob');
  });

  it('should return NOT_FOUND for a non-existent user', async () => {
    await expect(getUser({ id: 'nonexistent' })).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
    });
  });
});

describe('OrderService gRPC Calls', () => {
  const createOrder = (req) => promisify(orderClient, 'CreateOrder')(req);
  const getOrder = (req) => promisify(orderClient, 'GetOrder')(req);

  it('should create an order with line items', async () => {
    const res = await createOrder({
      user_id: 'u1',
      items: [
        { product_id: 'p1', quantity: 2, unit_price: 19.99 },
        { product_id: 'p2', quantity: 1, unit_price: 49.99 },
      ],
    });
    expect(res.order.id).toBeDefined();
    expect(res.order.total).toBeCloseTo(89.97, 1);
    expect(res.order.status).toBe('PENDING');
  });

  it('should retrieve an order with its items', async () => {
    const created = await createOrder({
      user_id: 'u1',
      items: [{ product_id: 'p1', quantity: 1, unit_price: 10.0 }],
    });
    const res = await getOrder({ id: created.order.id });
    expect(res.order.items).toHaveLength(1);
    expect(res.order.user_id).toBe('u1');
  });

  it('should reject an order with no items', async () => {
    await expect(createOrder({ user_id: 'u1', items: [] })).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });
});

describe('Protobuf Serialization', () => {
  it('should correctly serialize and deserialize enum values', async () => {
    const created = await promisify(orderClient, 'CreateOrder')({
      user_id: 'u1',
      items: [{ product_id: 'p1', quantity: 1, unit_price: 5.0 }],
    });
    expect(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']).toContain(created.order.status);
  });
});
