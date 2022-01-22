exports.up = async (trx) => {
  await trx.schema.withSchema('access')
    .table('person', (table) => {

      table.text('totpSecret')
        .notNullable()
        .defaultTo('');

      table.boolean('hasMfaEnabled')
        .notNullable()
        .defaultTo(true);
    });
};

exports.down = async (trx) => {
  await trx.schema.withSchema('access')
    .table('person', (table) => {
      table.dropColumn('totpSecret');
      table.dropColumn('hasMfaEnabled');
    });
};
