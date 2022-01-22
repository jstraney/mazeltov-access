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
    loggerLib,
    models: {
      rolePermissionModel,
    },
  } = ctx;

  const logger = loggerLib('app/controller/web/rolePermission');

  return webController('rolePermission', ctx)
    .get('/roles/:roleName/permissions', [
      _requireSessionAuth,
      _useCSRF,
      canAccess, {
        checkMethod: rolePermissionModel.canBulkPut,
      },
      useArgs, {
        params: [
          'roleName',
        ],
        query: [
          'permissionLabel',
          'page',
          'limit',
        ],
      },
      validateArgs, {
        validator: rolePermissionModel.validateList,
        errorTemplate: 'role/role-permission',
      },
      consumeArgs, {
        consumer: rolePermissionModel.list,
      },
      viewTemplate, {
        template: 'role/role-permission',
      },
    ])
    .post('/roles/:roleName/permissions', [
      _requireSessionAuth,
      _requireCSRF,
      _useCSRF,
      canAccess, {
        checkMethod: rolePermissionModel.canBulkPut,
        errorTemplate: 'error/_403',
      },
      useArgs, {
        params: [
          'roleName',
        ],
        body: [
          'createRolePermissionList',
          'removeRolePermissionList',
        ],
        static: {
          createRolePermissionList: [],
          removeRolePermissionList: [],
        },
        errorRedirectURL: '/roles/permissions',
      },
      validateArgs, {
        validator: rolePermissionModel.validateBulkPut,
        errorRedirectURL: '/roles/permissions',
      },
      consumeArgs, {
        consumer: rolePermissionModel.bulkPut,
      },
      redirect, {
        resultFlashMessage: ({ args }) => `The permissions for ${args.roleName} role have been saved.`,
        errorRedirectURL: 'back',
      },
    ]);

};
