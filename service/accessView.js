const path = require('path');

module.exports = ( ctx ) => {

  const {
    services: {
      hookService: {
        onRedux,
      },
    }
  } = ctx;

  onRedux('viewDir', (viewDirs) => [
    ...viewDirs,
    path.resolve(__dirname, '../view'),
  ]);

}
