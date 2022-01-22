const
crypto = require('crypto'),
fs     = require('fs'),
path   = require('path');

const { DateTime } = require('luxon');

const jwt = require('jsonwebtoken');

const base64url = require('base64url');

const {
  collection: {
    cross,
  },
  error: {
    BadRequestError,
    UnauthorizedError,
    UnprocessableEntityError,
  },
  rand: {
    randStr,
  },
  validate: {
    isNotEmpty,
    isString,
    isUnsigned,
    isOneOf,
    withLabel,
    withPaginators,
    eachHasSchema,
  },
  string: {
    split,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
} = require('@mazeltov/core/lib/model');

module.exports = ( ctx = {} ) => {

  const {
    services: {
      dbService: db,
      settingService: {
        getSettings,
      },
    },
    models: {
      clientModel,
      personModel,
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/model/tokenGrant');

  const [
    publicKeyPem,
    privateKeyPem,
  ] = getSettings([
    '@mazeltov/access.publicKeyPem',
    '@mazeltov/access.privateKeyPem',
  ]);


  const iface = modelFromContext({
    ...ctx,
    entityName: 'tokenGrant',
    selectColumns: [
      [
        'tokenGrant',
        [
          'id',
          'accessToken',
          'refreshToken',
          'personId',
          'clientId',
          'grantType',
          'code',
          'codeChallengeMethod',
          'isCodeUsed',
          'scopes',
          'isRevoked',
          'revokedAt',
          'createdAt',
          'updatedAt',
        ],
      ],
      [
        'person',
        [
          ['email', 'personEmail'],
          ['username', 'personUsername'],
          ['fullName', 'personFullName'],
        ],
      ],
      [
        'client',
        [
          ['label', 'clientLabel'],
        ],
      ],
    ],
    joins: [
      ['leftJoin', 'person', 'person.id', 'tokenGrant.personId'],
      ['leftJoin', 'client', 'client.id', 'tokenGrant.clientId'],
    ],
    schema: 'access',
    validators: {
      id: withLabel('Token grant ID', [
        isNotEmpty,
        isUnsigned,
      ]),
      personId: withLabel('Person ID', [
        isNotEmpty,
        isUnsigned,
      ]),
      client_id: withLabel('Client ID', [
        isNotEmpty,
        isString,
      ]),
      client_secret: withLabel('Client secret', [
        isNotEmpty,
        isString,
      ]),
      scopes: withLabel('Scopes', [
        isNotEmpty,
        isString,
      ]),
      code_challenge: withLabel('Code challenge', [
        isNotEmpty,
        isString,
      ]),
      code_verifier: withLabel('Code challenge', [
        isNotEmpty,
        isString,
      ]),
      code_challenge_method: withLabel('Code challenge method', [
        [isOneOf, ['plain', 'S256']],
      ]),
      redirect_url: withLabel('Redirect URL', [
        isNotEmpty,
        isString,
      ]),
      grant_type: withLabel('Grant type', [
        [isOneOf, ['password', 'client_credentials', 'authorization_code']]
      ]),
      username: withLabel('Username', [
        isNotEmpty,
        isString,
      ]),
      password: withLabel('Password', [
        isNotEmpty,
        isString,
      ]),
      tokenGrantList: withLabel('Token grant list', [
        [
          eachHasSchema,
          {
            id: withLabel('Token Grant ID', [
              isNotEmpty,
              isUnsigned,
            ]),
          },
        ],
      ]),
      ...withPaginators,
    },
    orderable: [
      'personUsername',
      'clientLabel',
      'createdAt',
      'revokedAt',
    ],
    onBuildListWhere: {
      equals: [
        'id',
        'personId',
        'grantType',
        'isCodeUsed',
        'isRevoked',
      ],
      like: [
        'personUsername',
        'clientId',
        'clientLabel',
      ],
      dateRange: [
        'createdAt',
        'updatedAt',
      ],
    },
  }, [
    'bulkRemove',
    'remove',
    'list',
    'get',
    // revoking tokens is actually a type of
    // bulkUpdater that defaults to setting the
    // isRevoked column
    [
      'bulkUpdate',
      {
        fnName: 'bulkRevoke',
        updateColumns: ['isRevoked'],
        defaultUpdateArgs: { isRevoked: true },
      },
    ],
    ...cross([ 'canAccess' ], [
      {
        fnName: 'canCreate',
      },
      {
        fnName: 'canBulkRevoke',
      },
      {
        fnName: 'canGet',
        scoped: true,
        ownershipArg: 'personId',
      },
      {
        fnName: 'canRemove',
        scoped: true,
        ownershipArg: 'personId',
      },
      {
        fnName: 'canRevoke',
        scoped: true,
        ownershipArg: 'personId',
      },
      {
        fnName: 'canRefresh',
        scoped: true,
        ownershipArg: 'personId',
      },
      {
        fnName: 'canList',
        scoped: true,
        ownershipArg: 'personId',
      },
    ]),
    ...cross([ 'validate' ], [
      {
        fnName: 'validateRefresh',
        toValidate: [
          'refresh_token'
        ],
      },
      {
        fnName: 'validateRevoke',
        toValidate: [
          'id',
        ],
      },
      {
        fnName: 'validateCreateClientToken',
        toValidate: [
          'client_id',
          'client_secret',
          'grant_type',
        ],
      },
      {
        fnName: 'validateCreatePasswordToken',
        toValidate: [
          'client_id',
          'client_secret',
          'username',
          'password',
          'grant_type',
        ],
      },
      {
        fnName: 'validateCreateCode',
        toValidate: [
          'client_id',
          'code_challenge',
          'code_challenge_method',
          'personId',
        ],
      },
      {
        fnName: 'validateCreateCodeToken',
        toValidate: [
          'code',
          'code_verifier',
        ],
      },
      {
        fnName: 'validateList',
        toValidate: [
          'page',
          'limit',
          'id',
          'personId',
          'grantType',
          'isCodeUsed',
          'isRevoked',
        ],
        optional: [
          'page',
          'limit',
          'id',
          'personId',
          'grantType',
          'isCodeUsed',
          'isRevoked',
        ],
      },
      {
        fnName: 'validateBulkRevoke',
        toValidate: [
          'tokenGrantList',
        ],
      },
      {
        fnName: 'validateRemove',
        toValidate: [
          'id',
        ],
      }
    ]),
  ]);

  const createCode = async ( args = {} ) => {

    const {
      client_id,
      code_challenge,
      code_challenge_method,
      personId,
      scopes,
      redirect_url,
    } = args;

    const client = await clientModel.get({ id: client_id });

    if (!client) {
      throw new UnprocessableEntityError('Unknown client ID');
    }

    const redirect_urls = split(client.redirectUrls);

    if (!redirect_urls.includes(redirect_url)) {
      throw new UnprocessableEntityError('Unrecognized client redirect URL');
    }

    const now = Math.floor(Date.now() / 1000);

    const expires = now + 60 * 60 * 4;

    const refresh_token = randStr(32);

    const code = randStr(32);

    const access_token = jwt.sign({
      jti: randStr(32),
      nce: randStr(16),
      exp: expires,
      sub: personId,
      scope: ['person'].concat(scopes).join(','),
      aud: client_id,
      nbf: now,
      iat: now,
    }, privateKeyPem, { algorithm: 'RS256' });

    // create the token but mark the code as not used.
    // if a refresh is attempted, this is checked in combination
    // with the grant_type to prevent a refresh (somehow) on a
    // token where the code hasn't been exchanged for this flow.
    await db('tokenGrant')
      .withSchema('access')
      .insert({
        access_token,
        refresh_token,
        client_id,
        personId,
        grant_type: 'authorization_code',
        code,
        code_challenge,
        code_challenge_method,
        // TODO: implement scopes right now the person scope treats it
        scopes: ['person'].concat(scopes).join(','),
        isCodeUsed: false,
      });

    const nextRedirectUrl = new URL(`?code=${code}`, redirect_url);

    return {
      redirect_url: nextRedirectUrl.toString(),
    };

  };

  const createToken = async ( args = {} ) => {

    const {
      grant_type,
    } = args;

    if (grant_type === 'client_credentials') {
      return createClientToken(args);
    } else if (grant_type === 'password') {
      return createPasswordToken(args);
    } else if (grant_type === 'authorization_code') {
      return createCodeToken(args);
    }

    throw new BadRequestError('Unrecognized grant type');

  };

  const createPasswordToken = async ( args = {} ) => {

    const {
      username,
      password,
      client_id,
      client_secret,
    } = args;

    logger.debug('creating password token');

    const client = await clientModel.get({
      id: client_id,
    });

    if (!client) {
      throw new UnprocessableEntityError('Unrecognized client');
    }

    if (!client.isConfidential) {
      throw new UnprocessableEntityError('Invalid grant type');
    }

    await clientModel.authenticate({
      id: client_id,
      secret: client_secret,
    });

    logger.debug('client id and secret look good');

    await personModel.authenticate({
      username,
      password,
    });

    const { id: personId } = await personModel.exists({
      username,
      email: username,
    });

    logger.debug('person username and password look good');

    const now = Math.floor(Date.now() / 1000);

    const expires = now + 60 * 60 * 4;

    const refresh_token = randStr(32);

    const access_token = jwt.sign({
      jti: randStr(32),
      nce: randStr(16),
      exp: expires,
      sub: personId,
      scope: 'person',
      aud: personId,
      nbf: now,
      iat: now,
    }, privateKeyPem, { algorithm: 'RS256' });

    await db('tokenGrant')
      .withSchema('access')
      .insert({
        access_token,
        refresh_token,
        client_id,
        personId,
        grant_type: 'password',
        scopes: 'person',
      });

    logger.debug('tokenGrant record created');

    return {
      access_token,
      refresh_token,
      expires,
    };

  };

  const createClientToken = async ( args = {} ) => {

    const {
      client_id,
      client_secret,
    } = args;

    logger.debug('creating client credentials token');

    const client = await clientModel.get({
      id: client_id,
    });

    if (!client.isConfidential) {
      throw new UnprocessableEntityError('Invalid grant type');
    }

    await clientModel.authenticate({
      id: client_id,
      secret: client_secret,
    });

    logger.debug('client id and secret look good');

    const now = Math.floor(Date.now() / 1000);

    const expires = now + 60 * 60 * 4;

    const refresh_token = randStr(32);

    const access_token = jwt.sign({
      jti: randStr(32),
      nce: randStr(16),
      exp: expires,
      sub: client_id,
      scope: 'client',
      aud: client_id,
      nbf: now,
      iat: now,
    }, privateKeyPem, { algorithm: 'RS256' });

    await db('tokenGrant')
      .withSchema('access')
      .insert({
        access_token,
        refresh_token,
        personId: null,
        client_id,
        scopes: 'person',
        grant_type: 'client_credentials',
      });

    logger.debug('tokenGrant record created');

    return {
      access_token,
      refresh_token,
      expires,
    };


  };

  const createCodeToken = async ( args = {} ) => {

    const {
      code,
      code_verifier,
    } = args;

    const [ tokenGrant ] = await db('tokenGrant')
      .withSchema('access')
      .where({
        code,
      });

    if (!tokenGrant) {
      throw new UnauthorizedError('unauthorized code');
    }

    if (tokenGrant.isCodeUsed) {
      throw new UnauthorizedError('unauthorized code');
    }

    const {
      grantType: grant_type,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    } = tokenGrant;

    if (grant_type !== 'authorization_code') {
      throw new UnauthorizedError('unauthorized grant type');
    }

    if (code_challenge_method === 'plain' ) {
      const match = code_verifier !== code_challenge;
      if (!match) {
        throw new UnauthorizedError('unauthorized code');
      }
    } else if (code_challenge_method === 'S256') {
      const verifierHash = crypto.createHash('sha256').update(code_verifier).digest('base64');
      const nextVerifier = base64url.fromBase64(verifierHash);
      const match = nextVerifier === code_challenge;
      if (!match) {
        throw new UnauthorizedError('Unauthorized code');
      }
    } else {
      throw new UnauthorizedError('Unrecognized code challenge method');
    }

    // update the code as used
    await db('tokenGrant')
      .withSchema('access')
      .update({
        isCodeUsed: true,
      })
      .where({
        id: tokenGrant.id,
      });

    const claims = await getJwtClaims(tokenGrant.accessToken);

    return {
      access_token: tokenGrant.accessToken,
      refresh_token: tokenGrant.refreshToken,
      expires: claims.exp,
    };

  };

  const getJwtClaims = (token) => {

    // we want to catch expired tokens because, well that's
    // why the token is being refreshed
    return new Promise((resolve, reject) => {
      jwt.verify(token, publicKeyPem, function (err, decoded) {

        logger.debug('decoded claims: %o', decoded)

        if (err == null) {
          return resolve(decoded);
        } else if (err.name !== 'TokenExpiredError') {
          throw err;
        }

        return resolve(jwt.decode(token));

      });
    });
  };

  const refreshToken = async ( args = {} ) => {

    const {
      refresh_token,
    } = args;

    if (!refresh_token) {
      throw new BadRequestError('refresh_token required');
    }

    logger.debug('refreshing token');

    // get the token so long as it has not been revoked
    const [ tokenGrant ] = await db('tokenGrant')
      .withSchema('access')
      .where({
        refreshToken: refresh_token,
        isRevoked: false,
      });

    if (!tokenGrant) {
      throw new UnauthorizedError('invalid refresh token');
    }

    // throw error if code was never used.
    if (tokenGrant.grantType === 'authorization_code' && !tokenGrant.isCodeUsed) {
      logger.debug('Auth code is not used. refresh not granted');
      throw new UnauthorizedError('invalid refresh token');
    }

    logger.debug('refresh_token found');

    const {
      accessToken: oldAccessToken,
    } = tokenGrant;

    const claims = await getJwtClaims(oldAccessToken);

    const now = Math.floor(Date.now() / 1000);

    const expires = now + 60 * 60 * 4;

    const nextRefreshToken = randStr(32);

    const nextAccessToken = jwt.sign({
      jti: claims.jti,
      nce: randStr(16),
      nce: randStr(16),
      exp: expires,
      sub: claims.sub,
      scope: claims.scope,
      aud: claims.aud,
      nbf: now,
      iat: claims.iat,
    }, privateKeyPem, { algorithm: 'RS256' });

    await db('tokenGrant')
      .withSchema('access')
      .update({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      })
      .where({
        id: tokenGrant.id,
      });

    logger.debug('updated tokenGrant record with new tokens');

    return {
      access_token: nextAccessToken,
      refresh_token: nextRefreshToken,
      expires,
    };

  };

  /*
   * Revoking a token simply prevents it from being
   * refreshed. Because we are using RSA signing, the
   * token will still be deemed valid by a resource server
   * with the matching public key. The client is then responsible
   * for discarding the access token so it does not continue
   * getting used.
   */
  const revokeToken = async ( args = {} ) => {

    const {
      id,
      refresh_token,
    } = args;

    const now = DateTime.now().toISO();

    await db('tokenGrant')
      .withSchema('access')
      .update({
        isRevoked: true,
        revokedAt: now,
      })
      .where((builder) => {
        if (id) {
          builder.where({id});
        } else if (refresh_token) {
          builder.where({ refreshToken: refresh_token });
        }
      });

    return {
      success: true,
    };

  };

  const whoAmI = async ( args = {} ) => {

    const {
      sub,
      scope,
      useRefreshToken,
      refresh_token,
    } = args;

    if (useRefreshToken && refresh_token) {

      const tokenGrant = await db('tokenGrant')
        .withSchema('access')
        .where({
          refresh_token,
        });

      if (!tokenGrant) {
        return null;
      }

      const {
        personId,
      } = tokenGrant;

      return personModel.get({ id: personId });

    }

    if (scope.includes('person')) {
      return personModel.get({ id: sub });
    } else if (scope.includes('client')) {
      return clientModel.get({ id: sub });
    }

    throw new UnprocessableEntityError('Unknown scope');

  };

  const validateCreateToken = async ( args = {} ) => {
    switch (args.grant_type) {
      case 'password':
        return iface.validateCreatePasswordToken(args);
      case 'client_credentials':
        return iface.validateCreateClientToken(args);
      case 'authorization_code':
        return iface.validateCreateCodeToken(args);
      default:
        throw new BadRequestError('Invalid grant type');
    }
    return true;
  };

  return {
    ...iface,
    createCode,
    createToken,
    createClientToken,
    createPasswordToken,
    createCodeToken,
    refreshToken,
    revokeToken,
    revoke: revokeToken,
    whoAmI,
    validateCreateToken,
  };

};
