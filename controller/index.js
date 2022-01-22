const
fs    = require('fs'),
http  = require('http'),
https = require('https'),
path  = require('path');

const {
  collection: {
    cross,
  },
} = require('@mazeltov/core/lib/util');

const {
  requireAuth,
  requireSessionAuth,
  useCSRF,
  requireCSRF,
} = require('@mazeltov/core/lib/middleware');

module.exports = async (ctx, controllerLoader) => {

  const {
    loggerLib,
    services: {
      hookService: {
        redux,
      },
    },
  } = ctx;

  const logger = loggerLib(`${ctx.SERVICE_NAME}/controller`);

  const app = require('express')();

  const nextCtx = {
    ...ctx,
    app,
    // static instances of middleware shared across http controllers that are
    // so common in how they are configured, only one instance is made
    // hence "static"
    ...redux('staticHttpMiddleware', {}),
  };

  const {
    httpController: httpControllerLoader,
    cliController: cliControllerLoader,
  } = await controllerLoader(nextCtx, [
    'http',
    'cli',
  ]);

  const
  httpController = await require('./http')(nextCtx, httpControllerLoader),
  apiControllers = await require('./api')(nextCtx, httpControllerLoader.apiRouters),
  webControllers = await require('./web')(nextCtx, httpControllerLoader.webRouters);

  return {
    httpController,
    apiControllers,
    webControllers,
    cliControllers: await require('./cli')({
      ...nextCtx,
      controllers: {
        httpController,
        apiControllers,
        webControllers,
      },
    }, cliControllerLoader),
  };

};
