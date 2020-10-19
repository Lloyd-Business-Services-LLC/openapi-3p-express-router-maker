const express = require('express');

const { connectRoutes } = require('./connect-routes');
const { mockControllers } = require('../../mocks/controllers');
const { mockMiddleware } = require('../../mocks/middleware');
const openApiMock = require('../../mocks/openapi-v3.json');

describe('Connect Routes', () => {
  let app;
  beforeEach(() => {
    app = express();
  });

  describe('When connecting routes', () => {
    let options = {
      controllers: mockControllers,
      middleware: mockMiddleware
    };

    it('should add the routes with controllers to the express application', () => {
      const connect = connectRoutes(openApiMock, options);

      connect(app);

      const routes = app._router.stack.slice(2, 4);

      expect(routes).toHaveLength(2);
      expect(routes[0].route.path).toEqual('/api/v1/health/ping');
      expect(routes[1].route.path).toEqual('/other-url/api/v1/health/ping');
    });
  });
});
