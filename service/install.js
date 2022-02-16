const
fs = require('fs').promises,
existsSync = require('fs').existsSync,
path = require('path');

const { execSync } = require('child_process');

const prompt = require('prompt');

const {
  rand: {
    randStr,
  },
} = require('@mazeltov/core/lib/util');

const bcrypt = require('bcrypt');

module.exports = async ( ctx ) => {

  const {
    appRoot,
    services: {
      dbService: db,
      settingService: {
        getSettings,
      },
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/service/install');

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
      installRsaPath: {
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

  // db is required for following steps.
  if (db) {

    const [
      orgName = 'Mazeltov',
      appHostname = 'local.mazeltov.com',
      appPort = 443,
    ] = await getSettings([
      'app.orgName',
      'app.hostname',
      'app.port',
    ]);

    const
    id = randStr(32),
    secret = randStr(32);

    const redirectUrls = appPort == 443
      ? `https://${appHostname}/account`
      : `https://${appHostname}:${appPort}/account`;

    logger.info('Saving default client information');
    logger.info('Writing this to your .env file');
    logger.tab();
    logger.info('MAZELTOV_ACCESS_SELF_CLIENT_ID: %s', id)
    logger.info('MAZELTOV_ACCESS_SELF_CLIENT_SECRET: %s', secret)
    logger.info('MAZELTOV_ACCESS_SELF_CLIENT_REDIRECT_URLS: %s', redirectUrls);
    logger.shiftTab();

    await db('client')
      .withSchema('access')
      .insert({
        id,
        secret: bcrypt.hashSync(secret, 12),
        isConfidential: true,
        redirectUrls,
        label: `${orgName} Default Client`,
      });

    await fs.appendFile(path.resolve(appRoot, '.env'), [
      '',
      `# @mazeltov/access`,
      `MAZELTOV_ACCESS_SELF_CLIENT_ID=${id}`,
      `MAZELTOV_ACCESS_SELF_CLIENT_SECRET=${secret}`,
      `MAZELTOV_ACCESS_SELF_CLIENT_REDIRECT_URLS=${redirectUrls}`,
    ].join('\n'));

    const {
      createAdmin,
    } = await prompt.get({
      properties: {
        createAdmin: {
          description: [
            'Do you want to make an admin user?',
          ].join(' '),
          required: true,
          default: 'yes',
        },
      },
    });

    if (/yes|y/i.test(createAdmin)) {

      const {
        username,
        password,
      } = await prompt.get({
        properties: {
          username: {
            description: [
              'username',
            ].join(' '),
            required: true,
            default: 'admin',
          },
          password: {
            description: [
              'password',
            ].join(' '),
            required: true,
            default: randStr(16),
          },
        },
      });

      const trx = await db.transaction();

      try {

        const [ row = null ] = await trx('person')
          .withSchema('access')
          .insert({
            fullName: 'Admin',
            username,
            email: `admin@${appHostname}`,
            password: bcrypt.hashSync(password, 12),
            emailVerificationToken: randStr(32),
            isEmailVerified: true,
          })
          .returning(['id']);

        const { id } = row;

        await trx('personRole')
          .withSchema('access')
          .insert({
            personId: id,
            roleName: 'administrator',
          });

        await trx.commit();

        logger.info('Admin user %s created', username);

      } catch (error) {

        logger.error('%o', error);
        logger.error('Could not create admin user');
        logger.error([
          'You can make an user with `mazeltov person create`',
          'then add administrator role with `mazeltov person role add`',
        ].join(' '));

        await trx.rollback();

      }
    }

  } else {

    logger.info('Could not save the default client');
    logger.info('It will have to be made using the `mazeltov client create` command');

  }

};
