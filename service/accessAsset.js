const path = require('path');

module.exports = ( ctx ) => {

  const {
    appRoot,
    services: {
      assetService,
    },
  } = ctx;

  assetService.registerAsset('mazeltov-access', path.resolve(__dirname, '../asset/main.js'));

};
