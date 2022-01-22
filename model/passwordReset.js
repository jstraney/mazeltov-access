        const {
  collection: {
    cross,
  },
  rand: {
    randStr,
  },
  error: {
    ConflictError,
  }
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => {

  return modelFromContext({
    ...ctx,
    entityName: 'passwordReset',
    schema: 'access',
    key: 'passwordResetRequestId',
    selectColumns: [
      [
        'passwordReset',
        [
          'passwordResetRequestId',
          'ip',
          'createdAt',
          'updatedAt',
        ],
      ],
    ],
    createColumns: [
      'passwordResetRequestId',
      'ip',
    ],
  }, [
    'get',
    'create',
    'list',
  ]);

};
