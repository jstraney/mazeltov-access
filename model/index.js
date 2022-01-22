module.exports = (ctx, modelLoader) => modelLoader(ctx, [
  'permission',
  'role',
  'rolePermission',
  'person',
  'client',
  'scope',
  'scopePermission',
  'personRole',
  'clientRole',
  'tokenGrant',
  'passwordReset',
  'passwordResetRequest',
], __dirname);
