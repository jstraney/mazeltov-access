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
  trx('role').withSchema('access').insert(buildArray(n, (i) => ({
    name: camelCase(faker.name.title()),
    label: faker.name.title(),
  })))
  .onConflict('name')
  .ignore();
};
