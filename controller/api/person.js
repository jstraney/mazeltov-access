const {
  apiController,
} = require('@mazeltov/core/lib/controller');

const {
  validate: {
    hasMaxLen,
    hasMinLen,
    isEmailExpression,
    isNotEmpty,
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
  consumeArgs,
  listSummaryDecorator,
  viewJSON,
} = require('@mazeltov/core/lib/middleware');

module.exports = ( ctx = {} ) => {

  const {
    models,
    loggerLib,
    _requireAuth,
  } = ctx;

  const {
    personModel,
    personRoleModel,
  } = models;

  const logger = loggerLib('@mazeltov/controller/api/person');

  return apiController('person', ctx)
    .post('/person', [
      _requireAuth,
      useArgs, {
        body: [
          'email',
          'username',
          'fullName',
          'password'
        ],
      },
      validateArgs, {
        validator: personModel.validateCreate,
      },
      canAccess, {
        checkMethod: personModel.canCreate,
      },
      consumeArgs, {
        consumer: personModel.create,
      },
      viewJSON(),
    ])
    .get('/person/verify', [
      useArgs, {
        query: [
          'token',
        ],
      },
      validateArgs, {
        validate: {
          token: withLabel('Token', [
            isString,
          ]),
        },
      },
      consumeArgs, {
        consumer: personModel.verify,
      },
      viewJSON(),
    ])
    .put('/person/:id', [
      _requireAuth,
      useArgs, {
        params: [
          'id',
        ],
        body: [
          'username',
          'email',
          'fullName',
          'mobilePhoneCountryCode',
          'mobilePhoneAreaCode',
          'mobilePhoneNumber',
        ],
      },
      validateArgs, {
        validator: personModel.validateUpdate,
      },
      canAccess, {
        checkMethod: personModel.canUpdate,
      },
      consumeArgs, {
        consumer: personModel.update,
      },
      viewJSON(),
    ])
    .get('/person/list', [
      _requireAuth,
      useArgs, {
        query: [
          'page',
          'limit',
          'fullName',
          'email',
          'username',
        ],
      },
      validateArgs, {
        validate: {
          fullName: withLabel('Full name', [
            isNotEmpty,
            isString,
          ]),
          email: withLabel('Email', [
            isNotEmpty,
            isString,
          ]),
          username: withLabel('Full name', [
            isNotEmpty,
            isString,
          ]),
          ...withPaginators()
        },
        optional: [
          'fullName',
          'email',
          'username',
        ],
      },
      canAccess, {
        checkMethod: personModel.canList,
      },
      consumeArgs, {
        consumer: personModel.list,
      },
      viewJSON(),
    ])
    .get('/person/:id', [
      _requireAuth,
      useArgs, {
        params: [
          'id',
        ],
        query: [
          'username',
          'email',
        ],
      },
      validateArgs, {
        validator: personModel.validateGet,
      },
      canAccess, {
        checkMethod: personModel.canGet,
      },
      consumeArgs, {
        consumer: personModel.get,
      },
      viewJSON(),
    ]);

};
