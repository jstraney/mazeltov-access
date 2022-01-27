const
fs = require('fs').promises,
existsSync = require('fs').existsSync,
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

  let [
    publicKeyPath = 'rsa/pub.pem',
    privateKeyPath = 'rsa/key.pem',
  ] = getSettings([
    '@mazeltov/access.publicKeyPath',
    '@mazeltov/access.privateKeyPath',
  ]);


  publicKeyPath = path.resolve(appRoot, publicKeyPath);
  privateKeyPath = path.resolve(appRoot, privateKeyPath);

  if (!existsSync(publicKeyPath) || !existsSync(privateKeyPath)) {
    logger.warn([
      "Your public or private key couldn't be read at",
      "%s or %s respectively. Try to install @mazeltov/access",
      "using `mazeltov module install @mazeltov/access` or create",
      "your own RSA key pair to load here."
    ].join(' '));
    return;
  }

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
