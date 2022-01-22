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
      personRoleModel,
    },
  } = ctx;

  return webController('personRole', ctx)
    .get('/person/:personId/roles', [
      _requireSessionAuth,
      _useCSRF,
      canAccess, {
        checkMethod: personRoleModel.canBulkPut,
      },
      useArgs, {
        params: [
          'personId',
        ],
        query: [
          'roleLabel',
          'page',
          'limit',
        ],
      },
      validateArgs, {
        validator: personRoleModel.validateList,
        errorTemplate: 'person/person-role',
      },
      consumeArgs, {
        consumer: personRoleModel.list,
      },
      viewTemplate, {
        template: 'person/person-role',
      },
    ])
    .post('/person/:personId/roles', [
      _requireSessionAuth,
      _requireCSRF,
      _useCSRF,
      canAccess, {
        checkMethod: personRoleModel.canBulkPut,
        errorTemplate: 'error/_403',
      },
      useArgs, {
        params: [
          'personId',
        ],
        body: [
          'createPersonRoleList',
          'removePersonRoleList',
        ],
        static: {
          createPersonRoleList: [],
          removePersonRoleList: [],
        },
        errorRedirectURL: 'back',
      },
      validateArgs, {
        validator: personRoleModel.validateBulkPut,
        errorRedirectURL: 'back',
      },
      consumeArgs, {
        consumer: personRoleModel.bulkPut,
      },
      redirect, {
        resultFlashMessage: ({ args }) => `The roles for this person have been saved.`,
        errorRedirectURL: 'back',
      },
    ]);

};
