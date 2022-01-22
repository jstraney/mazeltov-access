const {
  serviceExporter,
} = require('@mazeltov/core/lib/service');

module.exports = serviceExporter([
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
], 'model', __dirname);
