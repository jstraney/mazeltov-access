const {
  DateTime,
} = require('luxon');

const {
  collection: {
    cross,
  },
  rand: {
    randStr,
  },
  validate: {
    isString,
    isUnsigned,
    isNotEmpty,
    isEmailExpression,
    withLabel,
    withPaginators,
  },
  error: {
    ConflictError,
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
    models,
  } = ctx;

  const {
    passwordResetModel,
    personModel,
  } = models;

  const iface = modelFromContext({
    ...ctx,
    entityName: 'passwordResetRequest',
    schema: 'access',
    uniqueColumns: [
      'token',
    ],
    selectColumns: [
      [
        'passwordResetRequest',
        [
          'id',
          'token',
          'ip',
          'expiresAt',
          'personId',
          'email',
          'createdAt',
        ],
      ],
      [
        'passwordReset',
        [
          ['createdAt', 'resetCompletedAt'],
        ]
      ],
    ],
    joins: [
      [
        'leftJoin',
        'passwordReset',
        'passwordResetRequest.id',
        'passwordReset.passwordResetRequestId'
      ],
    ],
    createColumns: [
      'token',
      'ip',
      'expiresAt',
      'personId',
      'email',
    ],
    validators: {
      token: withLabel('Token', [
        isNotEmpty,
        isString,
      ]),
      ip: withLabel('IP address', [
        isNotEmpty,
        isString,
      ]),
      personId: withLabel('Person ID', [
        isNotEmpty,
        isUnsigned,
      ]),
      email: withLabel('Email', [
        isNotEmpty,
        isString,
        isEmailExpression,
      ]),
      password: withLabel('Password', [
        isNotEmpty,
        isString,
      ]),
      confirmPassword: withLabel('Confirm password', [
        isNotEmpty,
        isString,
      ]),
    },
  }, [
    'get',
    'remove',
    'create',
    'list',
    ...cross([ 'validate' ], [
      {
        fnName: 'validateVerify',
        toValidate: [
          'token',
          'ip',
        ],
        optional: [
          'ip',
        ],
      },
      {
        fnName: 'validateComplete',
        toValidate: [
          'token',
          'ip',
          'password',
          'confirmPassword',
        ],
        optional: [
          'ip',
        ],
      },
      {
        fnName: 'validateCreate',
        toValidate: [
          'email',
        ],
      },
    ]),
  ]);

  const create = async ( args = {} ) => {

    const {
      email,
    } = args;

    const person = await personModel.get({ email });

    if (!person) {
      throw new ConflictError('Unrecognized email address');
    }

    const token = randStr(32);

    const expiresAt = DateTime.now().plus({days: 1}).toISO();

    return iface.create({
      ...args,
      expiresAt,
      token,
      email,
      personId: person.id,
    });

  };

  const verify = async ( args = {} ) => {

    const {
      token,
      ip,
    } = args;

    const request = await iface.get({ token });

    if (!request) {
      throw new ConflictError('Could not reset password');
    }

    if (DateTime.now().toSQL() < request.expiresAt) {
      throw new ConflictError('The password reset link has expired');
    }

    const reset = await passwordResetModel.get({
      passwordResetRequestId: request.id,
    });

    if (reset) {
      throw new ConflictError('This reset link has already been used');
    }

    if (request.token !== token) {
      throw new ConflictError('Could not reset password');
    }

    return { success: true };

  };

  const complete = async ( args = {} ) => {

    const {
      token,
      ip,
      password,
      confirmPassword,
    } = args;

    const trx = await db.transaction();

    try {

      const resetRequest = await iface.get({
        token,
      });

      if (!resetRequest) {
        throw new ConflictError('Could not reset password');
      }

      if (resetRequest.resetCompletedAt) {
        throw new ConflictError([
          'The password reset token was already used.',
          'Request another password reset.',
        ].join(' '));
      }

      if (password !== confirmPassword) {
        throw new ConflictError('The confirmed password does not match.');
      }

      await personModel.update({
        id: resetRequest.personId,
        password,
      }, trx);

      // create a new reset record indicating consumption of token
      await passwordResetModel.create({
        passwordResetRequestId: resetRequest.id,
        ip,
      }, trx);

      await trx.commit();

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  };

  return {
    ...iface,
    create,
    createPasswordResetRequest: create,
    verify,
    verifyPasswordResetRequest: verify,
    complete,
    completePasswordRequest: complete,
  };

};
