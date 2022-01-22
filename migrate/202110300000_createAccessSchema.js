const {
  sentenceCase,
} = require('change-case');

const {
  collection: {
    cross,
  },
  string: {
    joinWords
  },
} = require('@mazeltov/util');

exports.up = async function(trx) {

  await trx.raw('CREATE SCHEMA IF NOT EXISTS access');

  await trx.schema
    .withSchema('access')
    .createTable('person', (table) => {

      table.comment([
        'A person is a person is a person. People includes all employees',
        'customers, affiliates, contractors and so forth. Any personal',
        'information that has authenticable function for a person',
        'belongs in this service under this entity. This includes',
        'username, primary email, and primary phone',
      ].join(' '));

      table.increments('id');

      table.string('email')
        .notNullable()
        .unique();

      table.string('username')
        .notNullable()
        .unique();

      table.string('fullName')
        .notNullable()
        .defaultTo('');

      table.string('password')
        .notNullable();

      table.boolean('isEmailVerified')
        .defaultTo(false)
        .notNullable();

      table.string('emailVerificationToken')
        .notNullable();

      table.string('mobilePhoneCountryCode')
        .comment('Country code prefix of phone number')
        .notNullable()
        .defaultTo('');

      table.string('mobilePhoneAreaCode')
        .comment('Area code prefix of phone number')
        .notNullable()
        .defaultTo('');

      table.string('mobilePhoneNumber')
        .comment('Last seven digits of the mobile phone number')
        .notNullable()
        .defaultTo('');

      table.timestamps(true, true);

      table.index('created_at', 'person_created_at_brin', 'brin');

    })
    .createTable('client', (table) => {

      table.comment([
        'A client is an application including web applications',
        'mobile apps, desktop apps and other services. A client can',
        'authenticate itself using the client auth flow or can authenticate',
        'a person using other flows.',
      ].join(' '));

      table.string('id')
        .notNullable()
        .primary();

      table.string('secret')
        .notNullable();

      table.string('label')
        .defaultTo('')
        .notNullable();

      table.integer('owner')
        .nullable();

      table.boolean('isConfidential')
        .comment([
          'A confidential client can be trusted to store its own secret',
          'such as a job running on a server. Single page apps and mobile',
          'apps are not confidential for example.',
        ].join(' '))
        .notNullable()
        .defaultTo(false);

      table.text('redirect_urls')
        .comment('Allowed redirect URLs when using the auth code flow')
        .notNullable()
        .defaultTo('');

      table.timestamps(true, true);

      table.index('created_at', 'client_created_at_brin', 'brin');

    })
    .createTable('session', (table) => {

      table.comment('Session table is designed to work with connect-pg-simple');

      table.string('id').primary()

      table.json('content')
        .notNullable();

      table.timestamp('expiresAt');

      table.timestamps(true, true);

      table.index('created_at', 'session_created_at_brin', 'brin');

    })
    .createTable('tokenGrant', (table) => {

      table.increments('id');

      table.string('access_token', 1024)
        .notNullable()
        .unique();

      table.string('refresh_token')
        .notNullable()
        .unique();

      table.integer('personId')
        .nullable()
        .references('id')
        .inTable('access.person')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('client_id')
        .references('id')
        .inTable('access.client')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('grant_type', 64)
        .notNullable();

      table.string('code')
        .nullable()
        .unique();

      table.string('code_challenge');

      table.string('code_challenge_method', 32);

      table.boolean('isCodeUsed')
        .nullable()

      table.text('scopes')
        .comment('space delimited token scopes')
        .notNullable()
        .defaultTo('');

      table.boolean('isRevoked')
        .defaultTo(false)

      table.timestamp('revokedAt', { precision: 6 })
        .nullable()
        .defaultTo(null);

      table.index('personId', 'tokenGrant_personId_hash', 'hash');

      table.timestamps(true, true);

      table.index('created_at', 'token_grant_created_at_brin', 'brin');

    })
    .createTable('passwordResetRequest', (table) => {

      table.increments('id');

      table.string('token')
        .unique();

      table.integer('personId')
        .references('id')
        .inTable('access.person')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('email')
        .notNullable();

      table.string('ip')
        .notNullable()
        .defaultTo('');

      table.timestamp('expiresAt', { precision: 6 });

      table.timestamps(true, true);

      table.index('created_at', 'password_reset_request_created_at_brin', 'brin');

    })
    .createTable('passwordReset', (table) => {

      table.comment([
        'The existence of the password reset record implies that the password',
        'reset request has had its token redeemed. Only completing the',
        'password reset will mark it as completed',
      ].join(' '));

      table.integer('passwordResetRequestId')
        .references('id')
        .inTable('access.passwordResetRequest')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
        .primary()

      table.string('ip')
        .comment([
          'IP address submitting the reset. May not be the same',
          'as the ip that submitted the reset request.',
        ].join(' '))
        .notNullable()
        .defaultTo('');

      table.index('passwordResetRequestId', 'passwordReset_passwordResetRequestId_hash', 'hash');

      table.timestamps(true, true);

      table.index('created_at', 'password_reset_created_at_brin', 'brin');

    })
    .createTable('role', (table) => {

      table.string('name')
        .primary();

      table.boolean('isAdministrative')
        .comment([
          'If a role is administrative it is treated as having',
          'all permissions herein.',
        ].join(' '))
        .defaultTo(false);

      table.string('label');

      table.timestamps(true, true);

      table.index('createdAt', 'role_createdAt_brin', 'brin');

    })
    .createTable('permission', (table) => {

      table.string('name')
        .primary();

      table.string('label');

      table.timestamps(true, true);

      table.index('createdAt', 'permission_createdAt_brin', 'brin');

    })
    .createTable('rolePermission', (table) => {

      table.string('roleName')
        .references('name')
        .inTable('access.role')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('permissionName')
        .references('name')
        .inTable('access.permission')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.timestamps(true, true);

      table.primary(['roleName', 'permissionName']);

      table.index('createdAt', 'rolePermission_createdAt_brin', 'brin');

    })
    .createTable('personRole', (table) => {

      table.integer('personId')
        .references('id')
        .inTable('access.person')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('roleName')
        .references('name')
        .inTable('access.role')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.primary(['personId', 'roleName']);

      table.timestamps(true, true);

      table.index('createdAt', 'personRole_createdAt_brin', 'brin');

    })
    .createTable('clientRole', (table) => {

      table.string('clientId')
        .references('id')
        .inTable('access.client')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('roleName')
        .references('name')
        .inTable('access.role')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.primary(['clientId', 'roleName']);

      table.timestamps(true, true);

      table.index('createdAt', 'clientRole_createdAt_brin', 'brin');

    })
    .createTable('scope', (table) => {

      table.comment([
        'Scopes work similarly to roles but mask the subjects permissions',
        'with the audience.',
      ].join(' '));

      table.string('name').primary();

      table.string('label');

      table.string('description');

      table.timestamps(true, true);

    })
    .createTable('scopePermission', (table) => {

      table.string('scopeName')
        .references('name')
        .inTable('access.scope')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.string('permissionName')
        .references('name')
        .inTable('access.permission')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');

      table.primary(['scopeName', 'permissionName']);

      table.timestamps(true, true);

    });

  // base permission names
  const permissionNames = ([
    ...cross(
      ['can'],
      ['create', 'update', 'remove', 'list', 'get'],
      ['permission', 'role', 'rolePermission']
    ),
    ...cross(
      ['can'],
      ['create', 'update', 'remove', 'list', 'get'],
      ['own', 'any'],
      ['person', 'client', 'personRole', 'clientRole']
    )
  ]).map(joinWords);

  await trx('permission')
    .withSchema('access')
    .insert(permissionNames.map((name) => {
    return {
      name,
      label: sentenceCase(name),
    };
  }))
  .onConflict('name')
  .merge();

  await trx('role')
    .withSchema('access')
    .insert([
    {
      name: 'administrator',
      label: 'Administrator',
      isAdministrative: true,
    },
  ])
  .onConflict('name')
  .merge();

  await trx('setting')
    .withSchema('mazeltov')
    .insert([
      {
        moduleName: '@mazeltov/access',
        name: 'jwtRsaPublicKeyPath',
        label: 'JWT Public Key Path',
        description: 'File path to the RSA public key used to verify JWTs',
        value: JSON.stringify('rsa/pub.pem'),
      },
      {
        moduleName: '@mazeltov/access',
        name: 'jwtRsaPrivateKeyPath',
        label: 'JWT Private Key Path',
        description: 'File path to the RSA private key used to sign JWTs (if any)',
        value: JSON.stringify('rsa/key.pem'),
      },
    ]);

};

exports.down = async function(trx) {

  await trx.schema
    .withSchema('access')
    .dropTable('session')
    .dropTable('personRole')
    .dropTable('clientRole')
    .dropTable('rolePermission')
    .dropTable('passwordReset')
    .dropTable('passwordResetRequest')
    .dropTable('tokenGrant')
    .dropTable('client')
    .dropTable('person')
    .dropTable('scopePermission')
    .dropTable('scope')
    .dropTable('permission')
    .dropTable('role');

};
