const {
  collection: {
    cross,
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

  const logger = loggerLib('@mazeltov/access/model/personRole');

  const iface = modelFromContext({
    ...ctx,
    logger,
    entityName: 'personRole',
    schema: 'access',
    key: ['personId', 'roleName'],
    selectColumns: [
      [
        'personRole',
        [
          'createdAt',
          'updatedAt',
        ],
      ],
      [
        'person',
        [
          ['id', 'personId'],
          ['username', 'personUsername'],
        ]
      ],
      [
        'role',
        [
          ['name', 'roleName'],
          ['label', 'roleLabel'],
          'isAdministrative'
        ],
      ]
    ],
    joins: [
      ['rightJoin', 'role', 'personRole.roleName', 'role.name'],
      ['leftJoin', 'person', 'personRole.personId', 'person.id'],
    ],
    createColumns: [
      'personId',
      'roleName',
    ],
    listArgs: [
      'personId',
      'permissionLabel',
    ],
    onBuildListWhere: (builder, args) => {
      const {
        personId,
        roleLabel,
      } = args;

      if (personId) {
        builder
          .where('person.id', personId)
          .orWhere('person.id', null);
      }
      // We have to explicitly apply
      // where to the permission table (not scopePermission)
      // because of how scopePermissions are viewed
      // (as a right joined relation so all permissions are
      // visible when a scope doesn't have them)
      if (roleLabel) {
        builder.where('role.label', 'ilike', `%${roleLabel}%`);
      }
    },
  }, [
    'create',
    'list',
    'bulkMerge',
    'bulkRemove',
    ...cross([ 'canAccess' ], [
      {
        fnName: 'canCreate',
        ownershipArg: 'personId',
        scoped: true,
      },
      {
        fnName: 'canList',
        ownershipArg: 'personId',
        scoped: true,
      },
      {
        fnName: 'canUpdate',
        ownershipArg: 'personId',
        scoped: true,
      },
      {
        fnName: 'canBulkPut',
        ownershipColumn: 'personId',
        scoped: true,
      },
      {
        fnName: 'canRemove',
        ownershipArg: 'personId',
        scoped: true,
      },
    ]),
  ]);

  const isPersonAdmin = async ( args = {} ) => {

    const {
      personId,
    } = args;

    logger.info('checking if person is admin: %o', args);

    const profileId = _makeProfileId(args, 'isPersonAdmin', 'PersonRole');
    logger.profile(profileId);

    return db
      .withSchema('access')
      .select([
        'personRole.personId AS personId',
        'role.isAdministrative AS isAdministrative',
      ])
      .from('personRole')
      .innerJoin('role', 'personRole.roleName', 'role.name')
      .where({ personId, isAdministrative: true })
      .limit(1)
      .then(([ row = null ]) => {
        logger.profile(profileId);
        return !!row;
      });

  };

  const getPersonPermissions = async ( args = {} ) => {

    const {
      personId,
    } = args;

    logger.info('getting person permissions: %o', args);

    const profileId = _makeProfileId(args, 'getPersonPermissions', 'PersonRole');
    logger.profile(profileId);

    if (!personId) {
      logger.profile(profileId);
      return {};
    }

    return db('permission')
      .withSchema('access')
      .distinct('permission.name AS permissionName')
      .from('permission')
      .innerJoin('rolePermission', 'rolePermission.permissionName', 'permission.name')
      .innerJoin('personRole', 'personRole.roleName', 'rolePermission.roleName')
      .where({ personId })
      .then((rows = []) => {

        logger.profile(profileId);
        return rows.reduce((lookup , { permissionName }) => ({
          ...lookup,
          [ permissionName ]: true,
        }), {});

      });

  };

  // We only check access using permissions. roles are a means to group
  // permissions but checking them leads to terrible patterns and hard to
  // reason about logic (roles change a lot, permissions should not).

  return {
    ...iface,
    getPersonPermissions,
    isPersonAdmin,
  };

};
