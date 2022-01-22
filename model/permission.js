const {
  collection: {
    cross,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => modelFromContext({
  ...ctx,
  key: 'name',
  entityName: 'permission',
  schema: 'access',
  selectColumns: [
    'name',
    'label',
    'createdAt',
    'updatedAt',
  ],
  updateColumns: [
    'label',
  ],
  createColumns: [
    'name',
    'label',
  ],
  onBuildListWhere: {
    like: [
      'name',
      'label',
    ],
  },
}, [
  'get',
  'remove',
  'update',
  'create',
  'list',
  ...cross([ 'canAccess' ], [
    { fnName: 'canCreate' },
    { fnName: 'canGet' },
    { fnName: 'canList' },
    { fnName: 'canUpdate' },
    { fnName: 'canRemove' },
  ]),
]);
