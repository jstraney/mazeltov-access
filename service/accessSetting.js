const
fs = require('fs').promises,
path = require('path');

module.exports = async ( ctx ) => {

  const {
    appRoot,
    services: {
      hookService: {
        onRedux,
      },
      settingService: {
        getSettings,
      },
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/service/accessSetting');

  const [
    publicKeyPath,
    privateKeyPath,
  ] = getSettings([
    '@mazeltov/access.publicKeyPath',
    '@mazeltov/access.privateKeyPath',
  ]);

  const [
    publicKeyPem,
    privateKeyPem,
  ] = await Promise.all([
    fs.readFile(path.resolve(appRoot, publicKeyPath), {encoding: 'utf8'}),
    fs.readFile(path.resolve(appRoot, privateKeyPath), {encoding: 'utf8'}),
  ]).catch((error) => {
    logger.error('%o', error);
    logger.error([
      '@mazeltov/access module cannot find one of your public/private',
      'key pem files. Make sure these files are available and readable at',
      '%s and %s respectively.',
    ], publicKeyPath, privateKeyPath);
    throw error;
  });

  onRedux('setting', (settings) => {
    console.log(settings);
    return {
      ...settings,
      '@mazeltov/access': {
        ...(settings['@mazeltov/access'] || {}),
        publicKeyPem,
        privateKeyPem,
      },
    }
  });

};
