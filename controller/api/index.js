module.exports = (ctx, apiLoader) => apiLoader(ctx, [

  'permission',
  [
    'get',
    'create',
    'update',
    'remove',
    'list',
  ],

  'role',
  [
    'get',
    'create',
    'update',
    'remove',
    'list',
  ],

  'rolePermission',
  [
    'list',
    'get',
  ],

  require('./person'),

  require('./client'),

  'personRole',
  [
    'list',
    'bulkMerge',
    'bulkRemove',
  ],

  'clientRole',
  [
    'list',
    'bulkMerge',
    'bulkRemove',
  ],

  require('./tokenGrant'),

  'scope',
  [
    'list',
    'create',
    'update',
    'remove',
  ],

  'scopePermission',
  [
    'list',
    'bulkCreate',
    'bulkRemove',
  ],

], __dirname);
