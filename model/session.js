const {
  validate: {
    withLabel,
    isString,
    isNotEmpty,
    isJSON,
    withPaginators,
  },
} = require('@mazeltov/core/lib/util');

const {
  modelFromContext,
  creator,
  getter,
  updater,
  remover,
  lister,
  subjectAuthorizer,
} = require('@mazeltov/core/lib/model');

/*
 * TODO: this was an idea I had to keep everything in PG, but
 * since session has moved to redis as primary driver, I am thinking
 * of chucking this.
 */
module.exports = ( ctx = {} ) => {

  const {
    services: {
      dbService: db,
    },
    loggerLib,
  } = ctx;

  const iface = modelFromContext({
    ...ctx,
    entityName: 'session',
    schema: 'access',
    selectColumns: [
      'id',
      'content',
      'expiresAt',
      'createdAt',
      'updatedAt',
    ],
    createColumns: [
      'id',
      'content',
    ],
    updateColumns: [
      'content',
    ],
    validators: {
      id: withLabel('Session ID', [
        isNotEmpty,
        isString,
      ]),
      content: withLabel('Session content', [
        isNotEmpty,
        isString,
        isJSON,
      ]),
      ...withPaginators(),
    },
  }, [
    creator,
    getter,
    updater,
    remover,
    lister
  ]);

  const all = (cb) => {
  }

  const length = (cb) => {
  }

  const get = () => {
  };

  const set = () => {
  };

  const destroy = () => {
  }

  const touch = () => {
  };

  return {
    get,
    set,
  }

}
