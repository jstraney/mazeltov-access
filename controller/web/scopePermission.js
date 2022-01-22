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
      scopePermissionModel,
    },
  } = ctx;

  return webController('scopePermission', ctx)
    .get('/scopes/:scopeName/permissions', [
      _requireSessionAuth,
      _useCSRF,
      canAccess, {
        checkMethod: scopePermissionModel.canBulkPut,
      },
      useArgs, {
        params: [
          'scopeName',
        ],
        query: [
          'permissionLabel',
          'page',
          'limit',
        ],
      },
      validateArgs, {
        validator: scopePermissionModel.validateList,
        errorTemplate: 'scope/scope-permission',
      },
      consumeArgs, {
        consumer: scopePermissionModel.list,
      },
      viewTemplate, {
        template: 'scope/scope-permission',
      },
    ])
    .post('/scopes/:scopeName/permissions', [
      _requireSessionAuth,
      _requireCSRF,
      _useCSRF,
      canAccess, {
        checkMethod: scopePermissionModel.canBulkPut,
        errorTemplate: 'error/_403',
      },
      useArgs, {
        params: [
          'scopeName',
        ],
        body: [
          'createScopePermissionList',
          'removeScopePermissionList',
        ],
        static: {
          createScopePermissionList: [],
          removeScopePermissionList: [],
        },
        errorRedirectURL: 'back',
      },
      validateArgs, {
        validator: scopePermissionModel.validateBulkPut,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: scopePermissionModel.bulkPut,
      },
      redirect, {
        resultFlashMessage: ({ args }) => `The permissions for ${args.scopeName} scope have been saved.`,
        errorRedirectURL: 'back',
      },
    ]);

};
