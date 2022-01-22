const {
  apiController,
} = require('@mazeltov/core/lib/controller');

const {
  useArgs,
  canAccess,
  consumeArgs,
  errorHandlers: {
    handleRequestError,
  },
  requireAuth,
  validateArgs,
  viewJSON,
} = require('@mazeltov/core/lib/middleware');

const {
  validate: {
    isNotEmpty,
    isOneOf,
    isString,
    isUnsigned,
    withLabel,
    withPaginators,
  },
} = require('@mazeltov/core/lib/util');

module.exports = (ctx = {}) => {

  const {
    loggerLib,
    models,
    services: {
      settingService: {
        getSetting,
      },
    },
    _requireAuth,
  } = ctx;

  const {
    tokenGrantModel,
  } = models;

  const logger = loggerLib('@mazeltov/controller/api/tokenGrant');

  const appCookieDomain = getSetting('app.cookieDomain');

  const router = require('express').Router();

  const getRefreshFromCookie = async (req, res, next) => {

    req.args.refresh_token = req.args.use_cookie === true
      ? req.signedCookies.refresh_token
      : req.body.refresh_token;

    logger.debug('refresh token: %s', req.args.refresh_token);

    next();

  };

  // TODO: carefully consider if this middleware
  // is really one or more re-usable patterns that can be
  // hoisted into the lib.js.middleware library
  /*
   * sends an access token by response body
   * and a refresh token by either response body
   * or secure cookie
   */
  const sendResponseToken = (req, res) => {

    const {
      result,
      error,
    } = res.locals;

    if (error) {
      return handleRequestError(req, res, error);
    }

    const {
      access_token,
      refresh_token,
      expires,
    } = result;

    // the refresh token can be resent in either a secure
    // cookie (for browsers) or in the body of request (servers)
    if (req.args.use_cookie === true) {
      res.cookie('refresh_token', refresh_token, {
        domain: appCookieDomain,
        maxAge: expires * 1000,
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        signed: true,
      });
      res.cookie('access_token', access_token, {
        domain: appCookieDomain,
        maxAge: expires * 1000,
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        signed: true,
      });
    }

    res.json(result);

  };

  return apiController('tokenGrant', ctx)
    .get('/token/list', [
      _requireAuth,
      useArgs, {
        query: [
          'personId',
          'clientId',
          'isRevoked',
          'revokedAt',
          'createdAt',
          'updatedAt',
          'page',
          'limit',
        ],
      },
      validateArgs, {
        validator: tokenGrantModel.validateList,
      },
      canAccess, {
        checkMethod: tokenGrantModel.canList,
        models,
      },
      consumeArgs, {
        consumer: tokenGrantModel.list,
      },
      viewJSON(),
    ])
    .delete('/token/:id', [
      _requireAuth,
      useArgs, {
        params: [
          'id',
        ],
      },
      validateArgs, {
        validator: tokenGrantModel.validateRemove,
      },
      canAccess, {
        checkMethod: tokenGrantModel.canRemove,
        models,
      },
      consumeArgs, {
        consumer: tokenGrantModel.remove,
      },
      viewJSON(),
    ])
    .post('/token', [
      useArgs, {
        body: [
          'grant_type',
          'username',
          'password',
          'client_id',
          'client_secret',
          'code_verifier',
          'code',
          'use_cookie',
        ],
      },
      validateArgs, {
        validator: tokenGrantModel.validateCreateToken,
      },
      consumeArgs, {
        consumer: tokenGrantModel.createToken,
      },
      sendResponseToken,
    ])
    .post('/token/refresh', [
      useArgs, {
        body: [
          'use_cookie',
          'refresh_token',
        ],
      },
      getRefreshFromCookie,
      validateArgs, {
        validate: {
          refresh_token: withLabel('Refresh token', [
            isNotEmpty,
            isString,
          ]),
        },
      },
      consumeArgs, {
        consumer: tokenGrantModel.refreshToken,
      },
      sendResponseToken,
    ])
    // basically a token introspection endpoint
    .get('/whoami', [
      _requireAuth,
      useArgs, {
        query: [
          'refresh_token',
        ],
      },
      validateArgs, {
        validate: {
          refresh_token: withLabel('Refresh token', [
            isNotEmpty,
            isString,
          ]),
        },
        optional: [
          'refresh_token',
        ],
      },
      (req, res, next) => {

        // These are populated from the JWT into the locals
        // of the response.
        const {
          sub,
          scope,
        } = res.locals.claims;

        req.args.sub = sub;
        req.args.scope = scope.split(' ');

        // we only handle trusted clients at the moment, so it
        // is fine to allow them to introspect a persons token
        // on their behalf.
        req.args.useRefreshToken = scope.includes('client');

        next();

      },
      consumeArgs, {
        consumer: tokenGrantModel.whoAmI,
        logger,
      },
      viewJSON(),
    ])
    // Revoking can be done by tokenGrant id, or by
    // sending the refresh token via body or cookie
    // TODO: use canAccess to ensure that tokenGrant id
    // can only be passed if the user is an authAdmin.
    .post('/token/revoke', [
      _requireAuth,
      useArgs, {
        body: [
          'use_cookie',
          'refresh_token',
        ],
      },
      getRefreshFromCookie,
      validateArgs, {
        validator: tokenGrantModel.validateRefresh,
      },
      canAccess, {
        checkMethod: tokenGrantModel.canRevoke,
      },
      consumeArgs, {
        consumer: tokenGrantModel.refreshToken,
      },
      sendResponseToken,
    ]);

};
