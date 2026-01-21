// Jest setup file
process.env.NODE_ENV = 'test';

// Mock console methods để clean output khi test
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
