module.exports = (ctx, webLoader) => webLoader(ctx, [

  require('./auth'),

  'role',
  [
    'list',
    'create',
    'remove',
    'update',
  ],

  require('./rolePermission'),

  'client',
  [
    'create',
    'remove',
    'update',
    'list',
  ],

  'tokenGrant',
  [
    'list',
  ],

  require('./tokenGrant'),

  'scope',
  [
    'list',
    'create',
    'update',
    'remove',
  ],

  require('./scopePermission'),

  'person',
  [
    'list',
    'create',
    'update',
    'remove',
  ],

  require('./personRole'),

], __dirname);
