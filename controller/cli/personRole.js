module.exports = (ctx) => {

  const {
    models,
  } = ctx;

  const {
    personRoleModel,
  } = models;

  return {
    'person role add': {
      consumer: personRoleModel.create,
      validator: personRoleModel.validateCreate,
      description: 'Assign a person a role',
      options: [
        { name: 'personId', type: Number},
        { name: 'roleName', type: String},
      ],
    },
    'person role remove': {
      consumer: personRoleModel.remove,
      validator: personRoleModel.validateRemove,
      description: 'Remove a persons role',
      options: [
        { name: 'personId', type: Number},
        { name: 'roleName', type: String},
      ],
    },
  };
}
