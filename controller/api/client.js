const {
  apiController,
} = require('@mazeltov/core/lib/controller');

const {
  validate: {
    hasMaxLen,
    hasMinLen,
    isNotEmpty,
    isUnsigned,
    isString,
    isBoolean,
    withLabel,
  },
} = require('@mazeltov/core/lib/util');

const {
  useArgs,
  validateArgs,
  canAccess,
  consumeArgs,
  viewJSON,
} = require('@mazeltov/core/lib/middleware');

module.exports = ( ctx = {} ) => {

  const {
    models,
    publicKeyPem,
    loggerLib,
    services,
    _requireAuth,
  } = ctx;

  const {
    clientModel,
  } = models;

  return apiController('client', ctx)
    .get('/client', [
      _requireAuth,
      useArgs, {
        query: ['id'],
      },
      validateArgs, {
        validator: clientModel.validateGet,
      },
      canAccess, {
        checkMethod: clientModel.canGet,
      },
      consumeArgs, {
        consumer: clientModel.get,
      },
      viewJSON(),
    ])
    .get('/client/list', [
      _requireAuth,
      useArgs, {
        query: [
          'id',
          'page',
          'limit',
          'owner',
          'isConfidential',
          'label',
        ],
      },
      validateArgs, {
        validator: clientModel.validateList,
      },
      canAccess, {
        checkMethod: clientModel.canList,
      },
      consumeArgs, {
        consumer: clientModel.list,
      },
      viewJSON(),
    ])
    .post('/client', [
      _requireAuth,
      useArgs, {
        body: [
          'secret',
          'label',
          'isConfidential',
          'redirect_urls',
        ],
      },
      validateArgs, {
        validator: clientModel.validateCreate,
      },
      canAccess, {
        checkMethod: clientModel.canCreate,
      },
      consumeArgs, {
        consumer: clientModel.create,
      },
      viewJSON(),
    ])
    .put('/client/:id', [
      _requireAuth,
      useArgs, {
        params: [
          'id',
        ],
        body: [
          'secret',
          'label',
          'isConfidential',
          'redirect_urls',
        ],
      },
      validateArgs, {
        validator: clientModel.validateUpdate,
      },
      canAccess, {
        checkMethod: clientModel.canUpdate,
      },
      consumeArgs, {
        consumer: clientModel.update,
      },
      viewJSON(),
    ])
    .delete('/client/:id', [
      _requireAuth,
      useArgs, {
        params: [
          'id',
        ],
      },
      validateArgs, {
        validator: clientModel.validateRemove,
      },
      canAccess, {
        checkMethod: clientModel.canRemove,
      },
      consumeArgs, {
        consumer: clientModel.remove,
      },
      viewJSON(),
    ]);

};
