const crypto = require('crypto');

const bcrypt = require('bcrypt');

const {
  error: {
    UnauthorizedError,
  },
  rand: {
    randStr,
  },
  map: {
    objectMapper,
  },
  collection: {
    cross,
    subObject,
  },
  validate: {
    isNotEmpty,
    isString,
    isUnsigned,
    isBoolean,
    withPaginators,
    withLabel,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = (ctx = {}) => {

  const {
    services: {
      dbService: db,
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/model/client');

  const iface = modelFromContext({
    ...ctx,
    logger,
    entityName: 'client',
    schema: 'access',
    key: 'id',
    createColumns: [
      'id',
      'isConfidential',
      'label',
      'redirectUrls',
      'secret',
    ],
    onWillCreate: objectMapper({
      id: [
        () => randStr(32),
      ],
      secret: [
        (value) => bcrypt.hashSync(value, 12),
      ],
    }),
    onWillUpdate: objectMapper({
      secret: [
        (value) => bcrypt.hashSync(value, 12),
      ],
    }, true),
    selectColumns: [
      [
        'client',
        [
          'id',
          'secret',
          'isConfidential',
          'redirectUrls',
          'owner',
          'label',
          'createdAt',
          'updatedAt',
        ],
      ],
      [
        'person',
        [
          ['username', 'ownerUsername'],
        ]
      ]
    ],
    joins: [
      ['leftJoin', 'person', 'client.owner', 'person.id'],
    ],
    updateColumns: [
      'label',
      'secret',
      'isConfidential',
      'redirectUrls',
    ],
    orderable: [
      'label',
      'createdAt',
      'updatedAt',
    ],
    onBuildListWhere: {
      like: [
        'id',
        'label',
      ],
      equals: [
        'isConfidential',
        'owner',
      ],
    },
    validators: {
      id: withLabel('Client ID', [
        isNotEmpty,
        isString,
      ]),
      secret: withLabel('Client secret', [
        isNotEmpty,
        isString,
      ]),
      label: withLabel('Client label', [
        isNotEmpty,
        isString,
      ]),
      redirect_urls: withLabel('Client redirect URLs', [
        isNotEmpty,
        isString,
      ]),
      owner: withLabel('Client owner', [
        isNotEmpty,
        isUnsigned,
      ]),
      isConfidential: withLabel('Is confidiential', [
        isBoolean,
      ]),
    },
  }, [
    'create',
    'get',
    'is',
    'remove',
    'list',
    'update',
    ...cross(['canAccess'], [
      {
        fnName: 'canCreate',
      },
      {
        fnName: 'canGet',
        ownershipColumn: 'owner',
        scoped: true,
      },
      {
        fnName: 'canUpdate',
        ownershipColumn: 'owner',
        scoped: true,
      },
      {
        fnName: 'canRemove',
        ownershipColumn: 'owner',
        scoped: true,
      },
      {
        fnName: 'canList',
        ownershipArg: 'owner',
        scoped: true,
      },
    ]),
    ...cross([ 'validate' ], [
      {
        fnName: 'validateCreate',
        toValidate: [
          'id',
          'secret',
          'label',
          'owner',
          'isConfidential',
          'redirect_urls',
        ],
        optional: [
          'id',
          'secret',
          'owner',
          'isConfidential',
          'redirect_urls',
        ],
      },
      {
        fnName: 'validateGet',
        toValidate: [
          'id',
        ],
      },
      {
        fnName: 'validateRemove',
        toValidate: [
          'id',
        ],
      },
      {
        fnName: 'validateUpdate',
        toValidate: [
          'id',
          'label',
          'owner',
          'isConfidential',
          'redirect_urls',
        ],
        optional: [
          'owner',
          'isConfidential',
          'redirect_urls',
        ],
      },
      {
        fnName: 'validateList',
        toValidate: [
          'id',
          'owner',
          'label',
          'isConfidential',
          'page',
          'limit',
        ],
        optional: [
          'id',
          'owner',
          'label',
          'isConfidential',
          'page',
          'limit',
        ],
      }
    ]),
    'introspect',
  ]);

  const authenticateClient = async function ( args = {} ) {

    const {
      id,
      secret: plainText,
    } = args;

    logger.info('checking if client is authentic: %o', args);

    const [ client = null ] = await db('client')
      .withSchema('access')
      .where({id});

    if (!client) {
      throw new UnauthorizedError('Unrecognized client');
    }

    const isAuthentic = await bcrypt.compare(plainText, client.secret);

    if (!isAuthentic) {
      throw new UnauthorizedError('Unrecognized client');
    }

    return true;

  };

  return {
    ...iface,
    authenticateClient,
    authenticate: authenticateClient,
  };

};
