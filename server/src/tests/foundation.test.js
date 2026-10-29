import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Joi from 'joi';
import app from '../src/app.js';
import { ROLES, TASK_STATUS, TASK_PRIORITY, PROJECT_STATUS, NOTIFICATION_TYPES, ACTION_TYPES } from '../src/constants/index.js';
import { validate } from '../src/middleware/validate.js';

describe('Phase 1 Foundation Verification', () => {
  let server;
  const PORT = 5099;

  before(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';
    await mongoose.connect(uri);

    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('1. Constants modules are frozen and define required enums', () => {
    assert.equal(Object.isFrozen(ROLES), true);
    assert.deepEqual(Object.values(ROLES), ['Admin', 'Manager', 'Employee']);

    assert.equal(Object.isFrozen(TASK_STATUS), true);
    assert.deepEqual(Object.values(TASK_STATUS), ['To Do', 'In Progress', 'In Review', 'Done']);

    assert.equal(Object.isFrozen(TASK_PRIORITY), true);
    assert.deepEqual(Object.values(TASK_PRIORITY), ['Low', 'Medium', 'High', 'Urgent']);

    assert.equal(Object.isFrozen(PROJECT_STATUS), true);
    assert.deepEqual(Object.values(PROJECT_STATUS), ['Planning', 'Active', 'On Hold', 'Completed']);

    assert.equal(Object.isFrozen(NOTIFICATION_TYPES), true);
    assert.equal(Object.isFrozen(ACTION_TYPES), true);
  });

  test('2. Reusable Joi validation middleware validates payloads correctly', () => {
    const testSchema = Joi.object({
      name: Joi.string().min(2).required(),
      role: Joi.string().valid(...Object.values(ROLES)).required()
    });

    const middleware = validate(testSchema, 'body');

    const reqInvalid = { body: { name: 'A', role: 'InvalidRole' } };
    let errorStatus = null;
    let errorJson = null;
    const resInvalid = {
      status: (code) => {
        errorStatus = code;
        return {
          json: (data) => {
            errorJson = data;
          }
        };
      }
    };
    middleware(reqInvalid, resInvalid, () => {});
    assert.equal(errorStatus, 400);
    assert.equal(errorJson.error, 'Validation failed');
    assert.equal(Array.isArray(errorJson.details), true);

    const reqValid = { body: { name: 'Alice', role: ROLES.MANAGER } };
    let nextCalled = false;
    const resValid = {};
    middleware(reqValid, resValid, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  test('3. GET /api/health returns 200 OK with connected database state', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/health`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.database, 'connected');
  });

  test('4. GET /api/unknown returns 404 Route Not Found', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/unknown`);
    assert.equal(response.status, 404);

    const data = await response.json();
    assert.equal(data.error, 'Route not found');
  });
});
