'use strict';

const connectRoutesService = require('./connect-routes.service');

/**
 * Parse an OpenAPI 3 specification and return a function to connect the controllers and middleware to the Express app.
 * @function
 * @param {object} openapi - an OpenAPI 3 specic/payload
 * @param {{controllers: object, middleware: object}} options - an options object containing the middleware and controllers to be connected.
 * @return {connectRoutes~connector} 
 */

exports.connectRoutes = (openapi, options = {}) => {
  if (typeof openapi !== 'object' || Array.isArray(openapi)) {
    throw new Error('No OpenAPI definition!');
  }

  if (!options.controllers) {
    throw new Error('No controllers have been defined!');
  }

  const { paths = null } = openapi;

  if (!paths) {
    throw new Error('No paths have been defined!');
  }

  const { controllers, middleware = null } = options;

  const formattedPaths = connectRoutesService.formatPaths(paths, controllers, middleware);

  const openapiVersion = connectRoutesService.getApiVersion(openapi);

  const basePaths = connectRoutesService.getBasePath(openapi, openapiVersion);

  const connector = (app) => {
    basePaths.forEach((basePath) => {
      formattedPaths.forEach(({ operation, path, mappedMiddleware, controller }) => {
        const functions = [...mappedMiddleware, controller];
        app[operation](`${basePath}${path}`, ...functions);
      });
    });
    return app;
  };

  return connector
};
