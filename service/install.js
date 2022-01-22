const
fs = require('fs').promises,
existsSync = require('fs').existsSync,
path = require('path');

const { execSync } = require('child_process');

const prompt = require('prompt');

module.exports = async ( ctx ) => {

  const {
    appRoot,
  } = ctx;

  const rootDir = appRoot;

  const {
    installRsa
  } = await prompt.get({
    properties: {
      installRsa: {
        description: [
          'Do you want to install RSA keys for JWT signing',
        ].join(' '),
        required: true,
        default: 'yes',
      },
    },
  });

  if (!/yes|y/i.test(installRsa)) {
    return;
  }

  const {
    installRsaPath,
  } = await prompt.get({
    properties: {
      installRsa: {
        description: [
          'Where do you want the key pair installed?',
        ].join(' '),
        required: true,
        default: path.resolve(rootDir, 'rsa'),
      },
    },
  });

  if (existsSync(installRsaPath)) {

    logger.info(`generating RSA for JWT signing`);

    const
    installRsaKeyPath = path.join(installRsaPath, 'key.pem'),
    installRsaPubPath = path.join(installRsaPath, 'pub.pem');

    // create private/public pem at rsa/ for JWT signing
    execSync(`openssl genrsa -out ${installRsaKeyPath} 2048`, { stdio: 'pipe'});
    execSync(`openssl rsa -in ${installRsaKeyPath} -pubout > ${installRsaPubPath}`, {stdio: 'pipe'});

  }

};
