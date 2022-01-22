(() => {

  owo.onRedux('webApi', (api, createApiEndpoint) => ({
    ...api,
    tokenGrant: {
      refresh: createApiEndpoint('/api/token/refresh', 'post', { data: { use_cookie: true } }),
      whoami: createApiEndpoint('/api/whoami'),
    },
    person: {
      get: createApiEndpoint('/api/person/:id'),
      list: createApiEndpoint('/api/person/list', 'get', { query: { page: 1, limit: 10 } }),
    },
    permission: {
      get: createApiEndpoint('/api/permission/:name'),
      list: createApiEndpoint('/api/permission/list', 'get', { query: { page: 1, limit: 10 } }),
    },
    role: {
      get: createApiEndpoint('/api/role/:name'),
      list: createApiEndpoint('/api/role/list', 'get', { query: { page: 1, limit: 10 } }),
    },
    client: {
      get: createApiEndpoint('/api/client/:id'),
      list: createApiEndpoint('/api/permission/list', 'get', { query: { page: 1, limit: 10 } }),
    },
  }));

})();
