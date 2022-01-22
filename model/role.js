const {
  collection: {
    cross,
  },
  validate: {
    isNotEmpty,
    isString,
    isBoolean,
    withLabel,
    withPaginators,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => modelFromContext({
  ...ctx,
  key: 'name',
  entityName: 'role',
  schema: 'access',
  selectColumns: [
    'name',
    'label',
    'isAdministrative',
    'createdAt',
    'updatedAt',
  ],
  updateColumns: [
    'label',
    'isAdministrative',
  ],
  defaultCreateArgs: {
    isAdministrative: false,
  },
  defaultUpdateArgs: {
    isAdministrative: false,
  },
  createColumns: [
    'name',
    'label',
    'isAdministrative',
  ],
  orderable: [
    'name',
    'label',
    'createdAt',
    'updatedAt',
  ],
  onBuildListWhere: {
    equals: [
      'isAdministrative',
    ],
    like: [
      'name',
      'label',
    ],
  },
  validators: {
    name: withLabel('Role name', [
      isString,
      isNotEmpty,
    ]),
    label: withLabel('Role label', [
      isString,
      isNotEmpty,
    ]),
    isAdministrative: withLabel('Role is administrative', [
      isBoolean,
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
      fnName: 'validateGet',
      toValidate: [
        'name',
      ],
    },
    {
      fnName: 'validateRemove',
      toValidate: [
        'name',
      ],
    },
    {
      fnName: 'validateUpdate',
      toValidate: [
        'name',
        'label',
        'isAdministrative',
      ],
      optional: [
        'isAdministrative',
      ],
    },
    {
      fnName: 'validateCreate',
      toValidate: [
        'name',
        'label',
        'isAdministrative',
      ],
      optional: [
        'isAdministrative',
      ],
    },
    {
      fnName: 'validateList',
      toValidate: [
        'name',
        'label',
        'isAdministrative',
        'page',
        'offset',
      ],
      optional: [
        'name',
        'label',
        'isAdministrative',
        'page',
        'offset',
      ],
    },
  ]),
]);
