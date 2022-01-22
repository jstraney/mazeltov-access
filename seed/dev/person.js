const {
  collection: {
    buildArray,
  },
  string: {
    camelCase,
  },
} = require('@mazeltov/core/lib/util');

const faker = require('faker');


// migration code here. no need to commit
// try catch, or rollback transaction.
module.exports = async (trx, n = 128) => {

  await trx('person').withSchema('access').insert(buildArray(n, (i) => ({
    username: faker.internet.userName(),
    email: faker.internet.email(),
    fullName: faker.fake('{{name.firstName}} {{name.lastName}}'),
    mobilePhoneCountryCode: faker.address.countryCode(),
    // have to left pad with 1.
    mobilePhoneAreaCode: faker.datatype.number({min: 100, max: 999 }),
    mobilePhoneNumber: faker.datatype.number({ min: 1000, max: 9999 }),
  })));

};
