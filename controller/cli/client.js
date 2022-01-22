module.exports = ( ctx = {} ) => {

  const {
    models,
  } = ctx;

  const {
    clientModel,
  } = models;

  return {
    'client create': {
      consumer: clientModel.create,
      validator: clientModel.validateCreate,
      description: 'Create a new client record',
      options: [
        { name: 'label', type: String},
        { name: 'owner', type: String},
        { name: 'isConfidential', type: Boolean, defaultValue: false},
        { name: 'redirectUrls', type: String},
        { name: 'secret', type: String},
        { name: 'id', type: String},
      ],
    },
  };
};
