module.exports = (ctx = {}) => {

  const {
    services: {
      routeService,
    },
  } = ctx;

  routeService.registerRoutes({
    'signIn' : {
      uri: '/sign-in',
      methods: ['get', 'post'],
    },
    'signOut' : {
      uri: '/sign-out',
      methods: ['get'],
    },
    'get:account' : {
      uri: '/account',
      methods: ['get'],
    },
    'verify': {
      uri: '/verify/:emailVerificationToken',
      methods: ['get'],
    },
    'authorize': {
      uri: '/allow',
      methods: ['get', 'post'],
    },
    'create:passwordResetRequest': {
      uri: '/password-reset/new',
      methods: ['get', 'post'],
    },
    'create:passwordReset': {
      uri: '/password-reset/:token',
      methods: ['get', 'post'],
    },
    'revoke:access.tokenGrant': {
      uri: '/token-grant/:id/revoke',
      methods: ['get', 'post'],
    },
    'bulkRevoke:access.tokenGrant': {
      uri: '/token-grant/:id/bulk-revoke',
      methods: ['post'],
    },

  });

};
