module.exports = ( ctx = {} ) => {

  const {
    models,
  } = ctx;

  const {
    personModel,
  } = models;

  return {
    'person create': {
      consumer: personModel.create,
      validator: personModel.validateCreate,
      description: 'Create a new person record',
      options: [
        { name: 'fullName', type: String},
        { name: 'email', type: String},
        { name: 'username', type: String},
        { name: 'password', type: String},
        { name: 'mobilePhoneCountryCode', type: String},
        { name: 'mobilePhoneAreaCode', type: String},
        { name: 'mobilePhoneNumber', type: String},
      ],
    },
  };
};
