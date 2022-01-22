module.exports = (ctx, serviceLoader) => serviceLoader(ctx, [
  'accessSetting',
  'accessAsset',
  'accessController',
  'accessRoute',
  'accessMenu',
  'accessView',
], __dirname);
