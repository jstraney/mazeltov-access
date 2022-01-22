const {
  collection: {
    cross,
  },
  validate: {
    validator: _validator,
    eachHasSchema,
    isArray,
    isNotEmpty,
    isString,
    withPaginators,
    withLabel,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
  _makeProfileId,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => {

  const {
    services: {
      dbService: db,
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/model/scopePermission');

  const iface = modelFromContext({
    ...ctx,
    key: [
      'scopeName',
      'permissionName',
    ],
    entityName: 'scopePermission',
    schema: 'access',
    selectColumns: [
      [
        'scopePermission',
        [
          'createdAt',
          'updatedAt',
        ],
      ],
      [
        'scope',
        [
          ['name', 'scopeName'],
          ['label', 'scopeLabel'],
        ]
      ],
      [
        'permission',
        [
          ['name', 'permissionName'],
          ['label', 'permissionLabel'],
        ],
      ]
    ],
    joins: [
      ['rightJoin', 'permission', 'scopePermission.permissionName', 'permission.name'],
      ['leftJoin', 'scope', 'scopePermission.scopeName', 'scope.name'],
    ],
    createColumns: [
      'scopeName',
      'permissionName',
    ],
    listArgs: [
      'scopeName',
      'permissionLabel',
    ],
    onBuildListWhere: (builder, args) => {
      const {
        scopeName,
        permissionLabel,
      } = args;

      if (scopeName) {
        builder
          .where('scope.name', scopeName)
          .orWhere('scope.name', null);
      }
      // We have to explicitly apply
      // where to the permission table (not scopePermission)
      // because of how scopePermissions are viewed
      // (as a right joined relation so all permissions are
      // visible when a scope doesn't have them)
      if (permissionLabel) {
        builder.where('permission.label', 'ilike', `%${permissionLabel}%`);
      }
    },

    validators: {
      scopeName: withLabel('Scope name', [
        isNotEmpty,
        isString,
      ]),
      permissionName: withLabel('Permission name', [
        isNotEmpty,
        isString,
      ]),
      scopePermissionList: withLabel('Scope Permissions', [
        isArray,
        [
          eachHasSchema,
          _validator({
            scopeName: withLabel('Scope Name', [
              isNotEmpty,
              isString,
            ]),
            permissionName: withLabel('Permission Name', [
              isNotEmpty,
              isString,
            ]),
          }),
        ],
      ]),
      ...withPaginators()
    },
  }, [
    'get',
    'remove',
    'create',
    'bulkCreate',
    'bulkRemove',
    'list',
    ...cross([ 'canAccess' ], [
      { fnName: 'canCreate' },
      { fnName: 'canGet' },
      { fnName: 'canList' },
      { fnName: 'canRemove' },
      { fnName: 'canBulkPut' },
    ]),
    ...cross([ 'validate' ], [
      {
        fnName: 'validateCreate',
        toValidate: [
          'scopeName',
          'permissionName',
        ],
      },
      {
        fnName: 'validateGet',
        toValidate: [
          'scopeName',
          'permissionName',
        ],
      },
      {
        fnName: 'validateRemove',
        toValidate: [
          'scopeName',
          'permissionName',
        ],
      },
      {
        fnName: 'validateList',
        toValidate: [
          'scopeName',
          'permissionName',
          'page',
          'limit',
        ],
        optional: [
          'scopeName',
          'permissionName',
          'page',
          'limit',
        ],
      },
      {
        fnName: 'validateBulkCreate',
        toValidate: [
          'scopePermissionList',
        ],
      },
      {
        fnName: 'validateBulkRemove',
        toValidate: [
          'scopePermissionList',
        ],
      },
      {
        fnName: 'validateBulkPut',
        toValidate: [
          ['scopePermissionList', 'createScopePermissionList'],
          ['scopePermissionList', 'removeScopePermissionList'],
        ],
      },
    ]),
  ]);

  /**
   * Produces a lookup map of permissions a scope allows. This map
   * is then intersected with the person permissions to provide a new map
   * of available permissions.
   */
  const getScopePermissionLookup = async ( args = {} ) => {

    const {
      scopeNames = [],
    } = args;

    logger.info('getting scope permissions: %o', args);

    const profileId = _makeProfileId(args, 'getScopePermissionLookup', 'ScopePermission');
    logger.profile(profileId);

    return db.withSchema('access')
      .distinct('scopePermission.permissionName AS permissionName')
      .from('scopePermission')
      .whereIn('scopePermission.scopeName', scopeNames)
      .then((rows = []) => {

        logger.profile(profileId);
        return rows.reduce((lookup , { permissionName }) => ({
          ...lookup,
          [ permissionName ]: true,
        }), {});

      });

  };

  const intersectScopePermissions = async ( args = {} ) => {

    const {
      scopePermissions = {},
      personPermissions = {},
    } = args;

    const nextLookup = {};

    for (const key in scopePermissions) {
      if (personPermissions[key] === true) {
        nextLookup[key] = true;
      }
    }

    return nextLookup;
  };

  const bulkPutScopePermission = async ( args = {} ) => {

    const {
      createScopePermissionList = [],
      removeScopePermissionList = [],
    } = args;

    logger.info('bulkPut scopePermission %o', args);

    const trx = await db.transaction();

    try {
      const ops = [];
      if (removeScopePermissionList.length) {
        ops.push(iface.bulkRemove({
          scopePermissionList: removeScopePermissionList,
        }, trx));
      }
      if (createScopePermissionList.length) {
        ops.push(iface.bulkCreate({
          scopePermissionList: createScopePermissionList,
        }, trx));
      }
      await Promise.all(ops);
      await trx.commit();
      return { success: true };
    } catch (error) {
      await trx.rollback();
      logger.error(error);
      throw error;
    }

  };

  return {
    ...iface,
    getScopePermissionLookup,
    getLookup: getScopePermissionLookup,
    intersectScopePermissions,
    intersect: intersectScopePermissions,
    bulkPutScopePermission,
    bulkPut: bulkPutScopePermission,
  };

};
