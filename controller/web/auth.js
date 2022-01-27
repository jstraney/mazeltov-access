const {
  collection: {
    lookupMap,
    peak,
  },
  string: {
    split,
  },
  validate: {
    hasMaxLen,
    hasMinLen,
    isEmailExpression,
    isNotEmpty,
    isOfEntityType,
    isOneOf,
    isUnsigned,
    isString,
    withLabel,
    withPaginators,
  },
} = require('@mazeltov/core/lib/util');

const {
  canAccess,
  useArgs,
  requireAuth,
  validateArgs,
  validateFormData,
  consumeArgs,
  requireCSRF,
  viewJSON,
  viewTemplate,
  sendEmail,
  redirect,
} = require('@mazeltov/core/lib/middleware');

const {
  webController,
} = require('@mazeltov/core/lib/controller');

module.exports = ( ctx = {} ) => {

  const {
    _requireAuth,
    _requireSessionAuth,
    _requireCSRF,
    _useCSRF,
    loggerLib,
    models,
    publicKeyPem,
    services,
    redisClient,
  } = ctx;

  const {
    clientModel,
    passwordResetRequestModel,
    personModel,
    personRoleModel,
    tokenGrantModel,
    scopeModel,
  } = models;

  const {
    emailService,
    settingService: {
      getSettings,
    },
  } = services;

  const logger = loggerLib('@mazeltov/controller/web/auth');

  const [
    appCookieDomain,
    appCookieMaxage,
    selfClientRedirectUrls,
    selfClientId,
    selfClientSecret,
  ] = getSettings([
    'app.cookieDomain',
    'app.cookieMaxage',
    '@mazeltov/access.selfClientRedirectUrls',
    '@mazeltov/access.selfClientId',
    '@mazeltov/access.selfClientSecret',
  ]);

  const authorizedSelfRedirects = split(selfClientRedirectUrls);

  // just use first value from authorized URLs as default redirect
  const defaultRedirectURL = peak(authorizedSelfRedirects);

  return webController('auth', ctx)
    .get('signIn', [
      _useCSRF,
      useArgs, {
        query: [
          'redirect_url',
        ],
        static: {
          redirect_url: defaultRedirectURL,
        },
        errorTemplate: 'error/_50x',
      },
      validateArgs, {
        validate: {
          redirect_url: withLabel('Redirect URL', [
            isNotEmpty,
            isString,
          ]),
        },
        errorTemplate: 'error/_50x',
      },
      viewTemplate,{
        template: 'auth/sign-in',
        title: 'Sign In',
      },
    ])
    .get('verify', [
      useArgs, {
        params: [
          'emailVerificationToken',
        ],
      },
      validateArgs, {
        validator: personModel.validateVerify,
      },
      consumeArgs, {
        consumer: personModel.verify,
      },
      redirect, {
        resultRedirectURL: '/account',
        resultFlashMessage: 'Your account has been successfully verified',
      }
    ])
    .post('signIn', [
      useArgs, {
        body: [
          'username',
          'password',
          'redirect_url',
        ],
        static: {
          client_id: selfClientId,
          client_secret: selfClientSecret,
          grant_type: 'password',
          redirect_url: defaultRedirectURL,
        },
      },
      _requireCSRF,
      _useCSRF,
      validateArgs, {
        validate: {
          username: withLabel('Username', [
            isNotEmpty,
            isString,
          ]),
          password: withLabel('Password', [
            isNotEmpty,
            isString,
          ]),
          client_id: withLabel('Client ID', [
            isNotEmpty,
            isString,
          ]),
          client_secret: withLabel('Client Secret', [
            isNotEmpty,
            isString,
          ]),
          grant_type: withLabel('Grant type', [
            isNotEmpty,
            [isOneOf, ['password']],
          ]),
          redirect_url: withLabel('Redirect URL', [
            isNotEmpty,
            isString,
          ]),
        },
        errorTemplate: 'auth/sign-in',
      },
      consumeArgs, {
        consumer: tokenGrantModel.createToken,
      },
      async function redirectOnSuccess (req, res, next) {

        const {
          result,
          error,
        } = res.locals;

        if (error) {
          logger.error('Error signing in: %o', error);
        }

        if (result) {

          const {
            redirect_url,
          } = req.args

          const {
            access_token,
            refresh_token,
            expires,
          } = result;

          res.cookie('refresh_token', refresh_token, {
            domain: appCookieDomain,
            maxAge: appCookieMaxage,
            sameSite: 'strict',
            secure: true,
            httpOnly: true,
            signed: true,
          });

          res.cookie('access_token', access_token, {
            domain: appCookieDomain,
            maxAge: appCookieMaxage,
            sameSite: 'strict',
            secure: true,
            httpOnly: true,
            signed: true,
          });

          const decodedUrl = decodeURIComponent(redirect_url)

          return res
            .status(307)
            .redirect(decodedUrl);

        }

        // go to sign in form if no auth token created
        next();

      },
      viewTemplate, {
        template: 'auth/sign-in',
        title: 'Sign In',
      },
    ])
    .get('signOut', [
      async function signOut (req, res, next) {
        res.clearCookie('refresh_token', {
          domain: appCookieDomain,
        });
        res.clearCookie('access_token', {
          domain: appCookieDomain,
        });
        if (req.session) {
          delete req.session.whoami;
        }
        next();
      },
      redirect, {
        resultRedirectURL: 'sign-in',
        resultFlashMessage: 'You have signed out successfully.',
      },
    ])
    .get('create:passwordResetRequest', [
      _useCSRF,
      viewTemplate, {
        template: 'auth/new-password-reset',
        title: 'Request Password Reset',
      },
    ])
    .post('create:passwordResetRequest', [
      _requireCSRF,
      _useCSRF,
      useArgs, {
        body: [
          'email',
        ],
      },
      validateArgs, {
        validator: passwordResetRequestModel.validateCreate,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: passwordResetRequestModel.create,
      },
      sendEmail, {
        toKey: 'email',
        subject: 'Your Password Reset Request',
        emailTemplate: 'mail/auth/new-password-reset-request',
      },
      redirect, {
        resultRedirectURL: '/sign-in',
        resultFlashMessage: ({ args}) => {
          return `A password reset request has been sent to ${args.email}.`;
        },
      },
    ])
    .get('create:passwordReset', [
      _useCSRF,
      useArgs, {
        params: [
          'token',
        ],
        req: [
          'ip',
        ],
      },
      validateArgs, {
        validator: passwordResetRequestModel.validateVerify,
        errorTemplate: 'auth/new-password-reset',
      },
      consumeArgs, {
        consumer: passwordResetRequestModel.verify,
      },
      viewTemplate, {
        template: 'auth/password-reset',
        templateOnError: 'auth/new-password-reset',
        title: 'Password Reset',
      },
    ])
    .post('create:passwordReset', [
      _requireCSRF,
      _useCSRF,
      useArgs, {
        params: [
          'token',
        ],
        body: [
          'password',
          'confirmPassword',
        ],
        req: [
          'ip',
        ],
      },
      validateArgs, {
        validator: passwordResetRequestModel.validateComplete,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: passwordResetRequestModel.complete,
      },
      redirect, {
        resultRedirectURL: '/sign-in',
        errorRedirectURL: 'back',
        resultFlashMessage: 'Your password has been changed successfully.',
      },
    ])
    .get('authorize', [
      _requireSessionAuth,
      _useCSRF,
      useArgs, {
        query: [
          'client_id',
          'scopes',
          'code_challenge',
          'code_challenge_method',
          'redirect_url',
        ],
        claims: [
          ['sub', 'personId'],
        ],
      },
      validateArgs, {
        validate: {
        },
        optional: [
          'scopes',
        ],
        errorTemplate: 'error/_403',
      },
      consumeArgs, {
        consumerMap: {
          client: ({ client_id }) => clientModel.get({ id: client_id}),
          scopes: ({ scopes }) => scopeModel.list({ nameIn: scopes }),
        },
      },
      viewTemplate, {
        template: 'auth/allow',
        templateOnNoResult: 'error/_403',
        requireResults: ['client', 'scopes'],
        title: 'Allow Application Access',
      },
    ])
    .post('authorize', [
      _requireSessionAuth,
      _requireCSRF,
      _useCSRF,
      useArgs, {
        body: [
          'client_id',
          'scopes',
          'code_challenge',
          'code_challenge_method',
          'redirect_url',
        ],
        claims: [
          ['sub', 'personId'],
        ],
      },
      validateArgs, {
        validator: tokenGrantModel.validateCreateCode,
      },
      consumeArgs, {
        consumer: tokenGrantModel.createCode,
      },
      redirect, {
        redirectFromResult: 'redirect_url',
        errorRedirectURL: 'back',
      },
    ])
    /**
    * This is such a common use case for this URI
    * that it's baked into the access module. If you want to
    * make a highly customized account page:
    *
    * - Try creating a profile table joined on access.person
    * - overwrite this route with your own to modify the result
    *   or even use the consumerMap option for consumeArgs
    * - create a custom person/view template to handle new
    *   result data.
    *
    * - overriding the URI is as simple as creating your own
    *   route service that calls onRedux('webRouteUri', *callback here* )
    */
    .get('get:account', [
      _requireSessionAuth,
      useArgs, {
        claims: [
          ['sub', 'id'],
        ],
      },
      canAccess, {
        checkMethod: personModel.canGet,
        models,
        errorTemplate: 'error/_403',
      },
      validateArgs, {
        validator: personModel.validateGet,
        errorTemplate: 'error/_50x',
      },
      consumeArgs, {
        consumer: personModel.get,
      },
      viewTemplate, {
        template: 'person/view',
      },
    ]);

};

