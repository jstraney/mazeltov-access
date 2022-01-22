const {
  collection: {
    cross,
  },
  validate: {
    isNotEmpty,
    isString,
    withPaginators,
    withLabel,
    isOkayIfEither,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => modelFromContext({
  ...ctx,
  key: 'name',
  entityName: 'scope',
  schema: 'access',
  selectColumns: [
    'name',
    'label',
    'description',
    'createdAt',
    'updatedAt',
  ],
  updateColumns: [
    'label',
    'description',
  ],
  createColumns: [
    'name',
    'label',
    'description',
  ],
  orderable: [
    'name',
    'label',
    'createdAt',
    'updatedAt',
  ],
  onBuildListWhere: {
    like: [
      ['name', 'nameLike'],
      ['label', 'labelLike'],
    ],
    oneOf: [
      ['name', 'nameIn'],
      ['label', 'labelIn'],
    ],
    equals: [
      'name',
      'label',
    ],
  },
  validators: {
    name: withLabel('Scope name', [
      isNotEmpty,
      isString,
    ]),
    label: withLabel('Scope label', [
      isNotEmpty,
      isString,
    ]),
    description: withLabel('Scope description', [
      isNotEmpty,
      isString,
    ]),
    ...withPaginators()
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
  ...cross([ 'validate' ], [
    {
      fnName: 'validateCreate',
      toValidate: [
        'name',
        'label',
        'description',
      ],
    },
    {
      fnName: 'validateUpdate',
      toValidate: [
        'name',
        'label',
        'description',
      ],
    },
    {
      fnName: 'validateRemove',
      toValidate: [
        'name',
      ],
    },
    {
      fnName: 'validateList',
      toValidate: [
        'name',
        ['nameIn', 'name'],
        ['nameLike', 'name'],
        'label',
        'page',
        'limit',
      ],
      optional: [
        'name',
        'nameIn',
        'nameLike',
        'scopeNames',
        'label',
        'page',
        'limit',
      ],
    },
  ]),
]);
