const crypto = require('crypto');

const {
  format: fmt,
} = require('util');

const bcrypt = require('bcrypt');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

const {
  collection: {
    subObject,
    cross,
  },
  error: {
    UnauthorizedError,
    ConflictError,
    UnprocessableEntityError,
  },
  map: {
    objectMapper,
  },
  rand: {
    randStr,
  },
  validate: {
    withLabel,
    hasMinLen,
    hasMaxLen,
    isString,
    isNotEmpty,
    isEmailExpression,
    isUnsigned,
    withPaginators,
  },
} = require('@mazeltov/core/lib/util');

module.exports = (ctx = {}) => {

  const {
    services: {
      dbService: db,
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/model/person');

  const iface = modelFromContext({
    ...ctx,
    entityName: 'person',
    schema: 'access',
    logger,
    selectColumns: [
      'id',
      'username',
      'email',
      'fullName',
      'isEmailVerified',
      'mobilePhoneCountryCode',
      'mobilePhoneAreaCode',
      'mobilePhoneNumber',
      'created_at',
      'updated_at',
    ],
    createColumns: [
      'username',
      'email',
      'fullName',
      'password',
      'isEmailVerified',
      'mobilePhoneCountryCode',
      'mobilePhoneAreaCode',
      'mobilePhoneNumber',
    ],
    onWillCreate: objectMapper({
      password: [
        (p) => bcrypt.hashSync(p, 12),
      ],
      emailVerificationToken: () => randStr(32),
    }),
    updateColumns: [
      'username',
      'email',
      'fullName',
      'password',
      'isEmailVerified',
      'mobilePhoneCountryCode',
      'mobilePhoneAreaCode',
      'mobilePhoneNumber',
    ],
    uniqueColumns: [
      'username',
      'email',
    ],
    onWillUpdate: objectMapper({
      password: [
        (p) => bcrypt.hashSync(p, 12),
      ],
    }, true),
    onBuildListWhere: {
      equals: [
        'id',
        'mobilePhoneCountryCode',
        'mobilePhoneAreaCode',
        'mobilePhoneNumber',
      ],
      like: [
        'username',
        'email',
        'fullName',
      ],
    },
    validators: {
      id: withLabel('Person ID', [
        isUnsigned,
        isNotEmpty,
      ]),
      username: withLabel('Username', [
        isNotEmpty,
        isString,
        [ hasMinLen, 3 ],
        [ hasMaxLen, 64 ],
      ]),
      email: withLabel('Email', [
        isNotEmpty,
        isString,
        [ hasMinLen, 3 ],
        [ hasMaxLen, 256],
        isEmailExpression,
      ]),
      emailVerificationToken: withLabel('Email verification token', [
        isNotEmpty,
        isString,
      ]),
      fullName: withLabel('Full name', [
        isNotEmpty,
        isString,
        [ hasMinLen, 1 ],
        [ hasMaxLen, 256 ],
      ]),
      password: withLabel('Password', [
        isNotEmpty,
        isString,
        [ hasMinLen, 8 ],
      ]),
      mobilePhoneCountryCode: withLabel('Mobile phone country code', [
        isString,
      ]),
      mobilePhoneAreaCode: withLabel('Mobile phone area code', [
        isString,
      ]),
      mobilePhoneNumber: withLabel('Mobile phone number', [
        isString,
      ]),
      ...withPaginators()
    },
  }, [
    'create',
    'get',
    'update',
    'remove',
    'list',
    'is',
    ...cross([ 'canAccess' ], [
      {
        fnName: 'canCreate',
      },
      {
        fnName: 'canGet',
        ownershipColumn: 'id',
        scoped: true,
      },
      {
        fnName: 'canRemove',
        ownershipColumn: 'id',
        scoped: true,
      },
      {
        fnName: 'canUpdate',
        ownershipColumn: 'id',
        scoped: true,
      },
      {
        fnName: 'canList',
        scoped: false,
      },
    ]),
    ...cross([ 'validate' ],[
      {
        fnName: 'validateGet',
        toValidate: [
          'id',
          'username',
          'email',
        ],
        optional: [
          'username',
          'email',
        ],
      },
      {
        fnName: 'validateCreate',
        toValidate: [
          'username',
          'email',
          'fullName',
          'password',
          'mobilePhoneCountryCode',
          'mobilePhoneAreaCode',
          'mobilePhoneNumber',
        ],
        optional: [
          'username',
          'mobilePhoneCountryCode',
          'mobilePhoneAreaCode',
          'mobilePhoneNumber',
        ],
      },
      {
        fnName: 'validateUpdate',
        toValidate: [
          'id',
          'username',
          'email',
          'fullName',
          'mobilePhoneCountryCode',
          'mobilePhoneAreaCode',
          'mobilePhoneNumber',
        ],
        optional: [
          'username',
          'email',
          'fullName',
          'mobilePhoneCountryCode',
          'mobilePhoneAreaCode',
          'mobilePhoneNumber',
        ],
      },
      {
        fnName: 'validateRemove',
        toValidate: [
          'id',
        ],
      },
      {
        fnName: 'validateList',
        toValidate: [
          'page',
          'limit',
        ],
        optional: [
          'page',
          'limit',
        ],
      },
      {
        fnName: 'validateVerify',
        toValidate: [
          'emailVerificationToken',
        ],
      }
    ]),
  ]);

  const personExists = async ( args = {} ) => {

    const {
      username,
      email,
    } = args;

    return db('person')
      .withSchema('access')
      .where((builder) => {
        if (username) {
          builder.where({ username })
        }
        if (email) {
          builder.orWhere({ email });
        }
      })
      .then(([ row = null ]) => row);

  }

  const authenticatePerson = async ( args = {} ) => {

    const {
      username,
      password: plainText,
    } = args;

    logger.debug('getting %s as username or email', username);

    const person = await personExists({
      username,
      email: username,
    });

    if (person === null) {
      throw new UnauthorizedError('Unrecognized credentials');
    }

    logger.debug('checking password');

    const isAuthentic = await bcrypt.compare(plainText, person.password);

    if (!isAuthentic) {
      throw new UnauthorizedError('Unrecognized credentials');
    }

    logger.debug('password looks good!');

    return true;

  };

  // used to verify e-mail token
  const verifyPerson = async ( args = {} ) => {

    const {
      emailVerificationToken,
    } = args;

    const updatedRows = await db('person')
      .withSchema('access')
      .update({
        isEmailVerified: true,
      }).where({
        emailVerificationToken
      });

    if (!updatedRows) {
      throw new UnprocessableEntityError('Unknown verification token');
    }

    return {
      success: true,
    };

  };

  return {
    ...iface,
    authenticatePerson,
    authenticate: authenticatePerson,
    personExists,
    exists: personExists,
    verifyPerson,
    verify: verifyPerson,
  };

};
