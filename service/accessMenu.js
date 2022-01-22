module.exports = ( ctx = {} ) => {

  const {
    services: {
      menuService,
    }
  } = ctx;

  menuService.registerMenus({
    admin: {
      items: {
        access: {
          title: 'Access',
          help: 'Manage and configure records related to access control.',
          items: {
            'list:access.person': ['People', ['can list any person']],
            'list:access.role': ['Roles', ['can list role']],
            'list:access.client': ['Clients', ['can list any client']],
            'list:access.scope': ['Scopes', ['can list scope']],
            'list:access.tokenGrant': ['Tokens', ['can list tokenGrant']],
          },
        },
      },
    },
    'list:access.person:primary': {
      items: {
        adminPage: ['Admin', ['can get adminPage']],
        'list:access.person': ['People', ['can list any person']],
        'create:access.person': ['New Person', ['can create any person']],
      },
    },
    'list:access.person:local': {
      items: {
        'update:access.person': ['Edit', ['can update any person']],
        'remove:access.person': ['Remove', ['can remove any person']],
        '/person/:id/roles': ['Roles', ['can update any personRole']],
      },
    },
    'list:access.client:primary': {
      items: {
        adminPage: ['Admin', ['can get adminPage']],
        'list:access.client': ['Clients', ['can list any client']],
        'create:access.client': ['New Client', ['can create any client']],
      },
    },
    'list:access.client:local': {
      items: {
        'update:access.client': ['Edit', ['can update any client']],
        'remove:access.client': ['Remove', ['can remove any client']],
      },
    },
    'list:access.role:primary': {
      items: {
        adminPage: ['Admin', ['can get adminPage']],
        'list:access.role': ['Roles', ['can list any role']],
        'create:access.role': ['New Role', ['can create any role']],
      },
    },
    'list:access.role:local': {
      items: {
        'update:access.role': ['Edit', ['can update any role']],
        'remove:access.role': ['Remove', ['can remove any role']],
        '/roles/:name/permissions': ['Permissions', ['can update any rolePermission']],
      },
    },
    'list:access.scope:primary': {
      items: {
        adminPage: ['Admin', ['can get adminPage']],
        'list:access.scope': ['Scopes', ['can list scope']],
        'create:access.scope': ['New Scope', ['can create scope']],
      },
    },
    'list:access.scope:local': {
      items: {
        'update:access.scope': ['Edit', ['can update scope']],
        'remove:access.scope': ['Remove', ['can remove scope']],
        '/scopes/:name/permissions': ['Permissions', ['can update scopePermission']],
      },
    },
    'list:access.tokenGrant:primary': {
      items: {
        adminPage: ['Admin', ['can get adminPage']],
        'list:access.tokenGrant': ['Tokens', ['can list any tokenGrant']],
      },
    },
    'list:access.tokenGrant:local': {
      items: {
        'revoke:access.tokenGrant': ['Revoke', ['can revoke own tokenGrant']],
      },
    },
    signedInTop: {
      items: {
        'get:account': ['My Account', ['can get own person']],
        signOut: ['Sign Out'],
      },
    },
    anonymousTop: {
      items: {
        signIn: ['Sign In'],
      },
    },
    accountPrimary: {
      items: {
        'get:account': ['My Account', ['can get own person']],
        adminPage: ['Admin', ['can get adminPage']],
      },
    }
  });

}
