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

  const logger = loggerLib('lib.js.model clientRole');

  const iface = modelFromContext({
    ...ctx,
    entityName: 'clientRole',
    schema: 'access',
    logger,
    key: ['clientId', 'roleName'],
    selectColumns: [
      [
        'clientRole',
        [
          'clientId',
          'roleName',
          'createdAt',
          'updatedAt',
        ],
      ],
      [
        'role',
        [
          ['label', 'roleLabel'],
        ]
      ]
    ],
    joins: [
      ['innerJoin', 'role', 'clientRole.roleName', 'role.name'],
    ],
    createColumns: [
      'clientId',
      'roleName',
    ],
    onBuildListWhere: {
      equals: [
        'clientId',
      ],
      like: [
        'roleName',
        'roleLabel',
      ],
    }
  }, [
    'list',
    'bulkMerge',
    'bulkRemove',
    ...cross([ 'canAccess' ], [
      {
        fnName: 'canList',
        ownershipArg: 'clientId',
        scoped: true,
      },
      {
        fnName: 'canUpdate',
        ownershipArg: 'clientId',
        scoped: true,
      },
      {
        fnName: 'canRemove',
        ownershipArg: 'clientId',
        scoped: true,
      },
    ]),
  ]);

  const isClientAdmin = async ( args = {} ) => {

    const {
      clientId,
    } = args;

    logger.info('checking if client is admin: %o', args);

    const profileId = _makeProfileId(args, 'isClientAdmin', 'ClientRole');
    logger.profile(profileId);

    return db
      .withSchema('access')
      .select([
        'clientRole.clientId AS clientID',
        'role.isAdministrative AS isAdministrative',
      ])
      .from('clientRole')
      .innerJoin('role', 'clientRole.roleName', 'role.name')
      .where({ clientId, isAdministrative: true })
      .limit(1)
      .then(([ row = null ]) => {

        logger.profile(profileId);
        return !!row

      });

  };


  const getClientPermissions = async ( args = {} ) => {

    const {
      clientId,
    } = args;

    logger.info('getting client permissions: %o', args);

    const profileId = _makeProfileId(args, 'getClientPermissions', 'ClientRole');
    logger.profile(profileId);

    if (!clientId) {
      logger.profile(profileId);
      return {};
    }

    return db('permission')
      .withSchema('access')
      .distinct('permission.name AS permissionName')
      .from('permission')
      .innerJoin('rolePermission', 'rolePermission.permissionName', 'permission.name')
      .innerJoin('clientRole', 'clientRole.roleName', 'rolePermission.roleName')
      .where({ clientId })
      .then((rows = []) => {

        logger.profile(profileId);
        return rows.reduce((lookup , { permissionName }) => ({
          ...lookup,
          [ permissionName ]: true,
        }), {});


      });

  };

  return {
    ...iface,
    getClientPermissions,
  };

};
