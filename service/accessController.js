const {
  collection: {
    peak,
  },
  string: {
    pascalCase,
  },
} = require('@mazeltov/core/lib/util');

const {
  canAccess,
  jwtToSession,
  requireAuth,
  requireCSRF,
  requireSessionAuth,
  useCSRF,
} = require('@mazeltov/core/lib/middleware');

module.exports = ( ctx = {} ) => {

  const {
    services: {
      aclService,
      hookService: {
        onRedux,
        redux,
      },
      modelService,
      routeService: {
        route,
      },
      settingService: {
        getSettings,
      },
    },
    loggerLib,
  } = ctx;

  const logger = loggerLib('@mazeltov/access/service/accessController');

  const [
    publicKeyPem,
    privateKeyPem,
  ] = getSettings([
    '@mazeltov/access.publicKeyPem',
    '@mazeltov/access.privateKeyPem',
  ]);

  const _requireAuth = requireAuth({
    publicKeyPem,
    logger,
  });

  const _requireSessionAuth = requireSessionAuth({
    publicKeyPem,
    redirectUriOnFail: route('signIn'),
    logger,
  });

  onRedux('staticHttpMiddleware', (prev = {}) => ({
    ...prev,
    _requireAuth,
    _requireSessionAuth,
  }));

  onRedux('webRouteUri', (route, action, entityInfo) => {
    if (entityInfo.entityName !== 'person') {
      return route;
    }
    switch(action) {
      case 'list':
        return '/people';
      default:
        return route;
    }
  });

  onRedux('apiRouteMiddleware', (stack, action, model, routeInfo) => {
    const doesRequireAuth = redux('apiRouteRequiresAuth', true, action, model);
    if (doesRequireAuth) {
      stack.front('requireAuth', _requireAuth);
    }
    const pascalAction = pascalCase(action);
    if (model[`can${pascalAction}`]) {
      const models = modelService.getModels();
      stack.after('useArgs', 'canAccess', canAccess({
        checkMethod: model[`can${pascalAction}`],
        models,
        logger,
      }));
    }
    return stack;
  });

  const applyAuthToWeb = (stack, action, model, routeInfo) => {

    const doesRequireAuth = redux('webRouteRequiresAuth', true, action, model);

    if (doesRequireAuth) {
      stack.front('requireSessionAuth', _requireSessionAuth);
    }

    const pascalAction = pascalCase(action);

    if (doesRequireAuth && model[`can${pascalAction}`]) {
      stack.after('useArgs', 'canAccess', canAccess({
        checkMethod: model[`can${pascalAction}`],
        models: modelService.getModels(),
        errorTemplate: 'error/_403',
        logger,
      }));
    }

    return stack;
  };

  onRedux('webRenderRouteMiddleware', applyAuthToWeb);
  onRedux('webSubmitRouteMiddleware', applyAuthToWeb);

  // many core pages use unscoped checkers
  const getCorePageAcl = (uri) => {
    switch (uri) {
      case 'adminPage': return ['can get adminPage'];
      case 'manage:cache': return ['can manage system:cache'];
      case 'purge:cache': return ['can purge system:cache'];
      case 'manage:model': return ['can manage system:model'];
      case 'manage:route': return ['can manage system:route'];
      default: return [];
    }
  }

  onRedux('adminWebHttpControllerRouteMiddleware', (stack, method, routeId) => {

    stack.front('requireSessionAuth', _requireSessionAuth);

    const acl = getCorePageAcl(routeId);

    if (acl.length) {
      stack.after('requireSessionAuth', 'canAccess', canAccess({
        checkMethod: aclService.unscopedChecker(acl),
        models: modelService.getModels(),
        errorTemplate: 'error/_403',
        logger,
      }));
    }

    return stack;

  });

  onRedux('webHttpControllerMiddleware', (stack) => {

    const models = modelService.getModels();

    stack.after('session', 'jwtToSession', jwtToSession({
      publicKeyPem,
      getPerson: (id) => models.personModel.get({id}),
      models,
    }));

    stack.after('useRequestLocals', 'bindAcl', (req, res, next) => {
      res.locals.session = req.session || {};
      if (req.session && req.session.whoami) {
        res.locals.gate = aclService.bindSubject(req.session.whoami);
      } else {
        res.locals.gate = aclService.bindSubject({});
      }
      next();
    });

    return stack;

  });

}
