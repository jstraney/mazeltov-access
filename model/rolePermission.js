const {
  collection: {
    cross,
  },
  validate: {
    isArray,
    isNotEmpty,
    isString,
    withLabel,
    eachHasSchema,
    withPaginators,
    validator: _validator,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => {

  const {
    services: {
      dbService: db,
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/model/rolePermission');

  const iface = modelFromContext({
    ...ctx,
    logger,
    entityName: 'rolePermission',
    key: ['roleName', 'permissionName'],
    schema: 'access',
    selectColumns: [
      [
        'rolePermission',
        [
          'createdAt',
          'updatedAt',
        ],
      ],
      [
        'role',
        [
          ['name', 'roleName'],
          ['label', 'roleLabel'],
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
      ['rightJoin', 'permission', 'rolePermission.permissionName', 'permission.name'],
      ['leftJoin', 'role', 'rolePermission.roleName', 'role.name'],
    ],
    createColumns: [
      'roleName',
      'permissionName',
    ],
    validators: {
      roleName: withLabel('Role Name', [
        isNotEmpty,
        isString,
      ]),
      permissionName: withLabel('Permission Name', [
        isNotEmpty,
        isString,
      ]),
      rolePermissionList: withLabel('Role Permissions', [
        isArray,
        [
          eachHasSchema,
          _validator({
            roleName: withLabel('Role Name', [
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
    listArgs: [
      'roleName',
      'permissionLabel',
    ],
    onBuildListWhere: (builder, args) => {
      const {
        roleName,
        permissionLabel,
      } = args;

      if (roleName) {
        builder
          .where('role.name', roleName)
          .orWhere('role.name', null);
      }
      // We have to explicitly apply
      // where to the permission table (not rolePermission)
      // because of how rolePermissions are viewed
      // (as a right joined relation so all permissions are
      // visible when a role doesn't have them)
      if (permissionLabel) {
        builder.where('permission.label', 'ilike', `%${permissionLabel}%`);
      }
    },
  }, [
    'get',
    'list',
    'bulkRemove',
    'bulkCreate',
    'create',
    'remove',
    ...cross([ 'validate' ], [
      {
        fnName: 'validateGet',
        toValidate: [
          'roleName',
          'permissionName',
        ],
      },
      {
        fnName: 'validateBulkPut',
        toValidate: [
          ['rolePermissionList', 'createRolePermissionList'],
          ['rolePermissionList', 'removeRolePermissionList'],
        ],
      },
      {
        fnName: 'validateBulkRemove',
        toValidate: [
          'rolePermissionList',
        ],
      },
      {
        fnName: 'validateCreate',
        toValidate: [
          'roleName',
          'permissionName',
        ],
      },
      {
        fnName: 'validateRemove',
        toValidate: [
          'roleName',
          'permissionName',
        ],
      },
      {
        fnName: 'validateList',
        toValidate: [
          'roleName',
          'permissionLabel',
          'page',
          'limit',
        ],
        optional: [
          'roleName',
          'permissionList',
          'page',
          'limit',
        ],
      },
    ]),
    ...cross([ 'canAccess' ], [
      { fnName: 'canList' },
      { fnName: 'canCreate' },
      { fnName: 'canUpdate' },
      { fnName: 'canBulkPut' },
      { fnName: 'canBulkRemove' },
      { fnName: 'canRemove' },
    ]),
  ]);

  const bulkPutRolePermission = async ( args = {} ) => {

    const {
      createRolePermissionList = [],
      removeRolePermissionList = [],
    } = args;

    logger.info('bulkPut rolePermission %o', args);

    const trx = await db.transaction();

    try {
      const ops = [];
      if (removeRolePermissionList.length) {
        ops.push(iface.bulkRemove({
          rolePermissionList: removeRolePermissionList,
        }, trx));
      }
      if (createRolePermissionList.length) {
        ops.push(iface.bulkCreate({
          rolePermissionList: createRolePermissionList,
        }, trx));
      }
      const results = await Promise.all(ops);
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
    bulkPutRolePermission,
    bulkPut: bulkPutRolePermission,
  };

};
