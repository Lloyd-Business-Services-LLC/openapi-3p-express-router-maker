'use strict';

const { get } = require('lodash');
const { URL } = require('url');

/**
 * A recursive function to find and return the value based on a match of the property name to provided key
 * @function
 * @param {object} obj - an object on which to perform a recursive search
 * @param {string} key - the name/key of the property to find and return
 * @return {function}
 */

const recursiveSearch = (obj, key) => {
  let val = null;

  Object.keys(obj).some((k) => {
    if (k === key) {
      val = obj[k];
      return true;
    }

    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      val = recursiveSearch(obj[k], key);
      return val !== undefined;
    }
  });

  return val;
};


/**
 * A function to extract the base path from the server defintion of OpenAPI 3.0
 * @function
 * @param {object} openapi - an OpenAPI 3 specification
 * @return {Array}
 */


const getBasePathFromServer = (openapi) => {
  const servers = get(openapi, 'servers');

  if (!servers || !Array.isArray(servers) || servers.length < 1) {
    return [''];
  }

  const basePaths = servers.reduce((acc, cur) => {
    if (get(cur, 'url') && get(cur, 'url').search('http') !== -1) {
      const url = new URL(get(cur, 'url'));
      return acc.add(url.pathname);
    }

    if (get(cur, 'url')) {
      return acc.add(get(cur, 'url'));
    }
    return acc;
  }, new Set());

  return [...basePaths];
};

/**
 * A function to extract the base path from the either an OpenAPI 3 or Swagger 2 specification
 * @function
 * @param {object} openapi - an OpenAPI 3 or 3.1 specification
 * @param {Number} openApiVersion - the version of the OpenAPI specification
 * @return {String}
 */

const getBasePath = (openapi, openApiVersion) => {
  // we support 3 and 3.1 (for the moment)
  if (openApiVersion === 3 || openApiVersion === 3.1) {
    return getBasePathFromServer(openapi);
  }

  // we deprioritize the check for anything other than ver. 3
  // and void the return, so to speak (removing support)
  if (openApiVersion != 3 || openApiVersion != 3.1) {
    //return [get(openapi, 'basePath', '')];
    return '';
  }

  return '';
};

/**
 * A function to extract the query parameters for a given path
 * @function
 * @param {String} path - the path string
 * @return {String}
 */

const parseParams = (path) => {
  const paramIndex = path.indexOf('{');

  if (paramIndex === -1) {
    return path;
  }

  // replaced deprecated substr() methods
  const basePath = path.substring(0, paramIndex);
  const param = path.substring(paramIndex).replace(/[{}]/g, '');

  return `${basePath}:${param}`;
};

/**
 * A function to map the middleware passed in to the x-middleware-id in the OpenAPI specification
 * @function
 * @param {Array} routeMiddleware - an array of x-middlware-id's 
 * @param {object} middleware - an object containing the middleware functions
 * @return {Array}
 */

const mapMiddleware = (routeMiddleware, middleware) => {
  if (!middleware && !routeMiddleware) {
    return [];
  }

  if (routeMiddleware.length > 0 && !middleware) {
    throw new Error(
      'Middleware defined in OpenAPI definition but no middleware provided in options'
    );
  }

  const mappedMiddleware = new Set();

  if (middleware) {
    routeMiddleware.forEach((rmw) => {
      const mpMw = recursiveSearch(middleware, rmw);

      if (!mpMw) {
        throw new Error(
          `Middleware: ${rmw}: defined in OpenAPI definition but not provided in options`
        );
      }

      mappedMiddleware.add(mpMw);
    });
  }

  return [...mappedMiddleware];
};

/**
 * A function to hook up the controllers and middleware to the paths defined in an OpenAPI 3 or Swagger 2 definition
 * @function
 * @param {Array} paths - an array of paths
 * @param {object} controllers - an object containing the controller functions
 * @param {object} middleware - an object containing the middleware functions
 * @return {Array.<{path: String, operation: String, controller: Fnction, mappedMiddleware: Array}>}
 */

const formatPaths = (paths, controllers, middleware) => {
  const formattedPaths = [];

  Object.keys(paths).forEach((pathsKey) => {
    Object.keys(paths[pathsKey]).forEach((pathKey) => {
      const operationId = paths[pathsKey][pathKey]['operationId'];
      const mappedMiddleware = mapMiddleware(paths[pathsKey][pathKey]['x-middleware'], middleware);

      const controller = recursiveSearch(controllers, operationId);

      if (!controller) {
        throw new Error(
          `No controller found for ${pathsKey}/${pathKey} which matches operationId: ${operationId}`
        );
      }

      const formattedPath = {
        path: parseParams(pathsKey),
        operation: pathKey,
        controller,
        mappedMiddleware
      };
      formattedPaths.push(formattedPath);
    });
  });

  return formattedPaths;
};


/**
 * A function to return the api version from the spec
 * 
 * @param {Array} paths - an array of paths
 * @param {object} openapi - an OpenAPI 3 or Swagger 2 specification
 * @return {Number}
 */

const getApiVersion = (openapi) => {
  // default to ver 3+ (removing ver. 2/"swagger" support)
  let openapiVersion = get(openapi, 'openapi');

  // we'll check for undefined (ver.2 presumably) and return undefined
  if (!openapiVersion) {
    //openapiVersion = get(openapi, 'openapi');
    openapiVersion = undefined;
  }

  if (!openapiVersion || typeof openapiVersion !== 'string') {
    throw new Error('OpenAPI version is not defined');
  }

  // we now return (as a number) the first 3 characters of the version string
  return +openapiVersion.substring(0,3);
};

module.exports = {
  recursiveSearch,
  getBasePathFromServer,
  getBasePath,
  parseParams,
  mapMiddleware,
  formatPaths,
  getApiVersion
};
