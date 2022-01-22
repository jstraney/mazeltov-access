const {
  webController,
} = require('@mazeltov/core/lib/controller');

const {
  canAccess,
  consumeArgs,
  redirect,
  sendEmail,
  useArgs,
  validateArgs,
  viewTemplate,
} = require('@mazeltov/core/lib/middleware');

module.exports = ( ctx = {} ) => {

  const {
    _requireSessionAuth,
    _useCSRF,
    _requireCSRF,
    models: {
      tokenGrantModel,
    },
  } = ctx;

  return webController('tokenGrant', ctx)
    .get('revoke:access.tokenGrant', [
      _requireSessionAuth,
      _useCSRF,
      useArgs, {
        params: [
          'id',
        ],
        errorRedirectURL: 'back',
      },
      canAccess, {
        checkMethod: tokenGrantModel.canRevoke,
        errorTemplate: 'errors/_403',
      },
      validateArgs, {
        validator: tokenGrantModel.validateGet,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: tokenGrantModel.get,
      },
      viewTemplate, {
        template: 'token-grant/revoke',
      },
    ])
    .post('revoke:access.tokenGrant', [
      _requireSessionAuth,
      _requireCSRF,
      _useCSRF,
      useArgs, {
        params: [
          'id',
        ],
        errorRedirectURL: 'back',
      },
      canAccess, {
        checkMethod: tokenGrantModel.canRevoke,
        errorTemplate: 'errors/_403',
      },
      validateArgs, {
        validator: tokenGrantModel.validateRevoke,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: tokenGrantModel.revoke,
      },
      redirect, {
        resultFlashMessage: `The token has been revoked`,
      }
    ])
    .post('bulkRevoke:access.tokenGrant', [
      _requireSessionAuth,
      _requireCSRF,
      _useCSRF,
      canAccess, {
        checkMethod: tokenGrantModel.canBulkRevoke,
        errorTemplate: 'errors/_403',
      },
      useArgs, {
        body: [
          'tokenGrantList',
        ],
        errorRedirectURL: 'back',
      },
      validateArgs, {
        validator: tokenGrantModel.validateBulkRevoke,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: tokenGrantModel.bulkRevoke,
      },
      redirect, {
        resultFlashMessage: ({ result }) => {
          return result.success
            ? 'The tokens were revoked'
            : 'The tokens could not be revoked';
        },
        errorRedirectURL: 'back',
      },
    ]);

};
