module.exports = [
  'jwtToSession',
  'requireAuth',
  'requireSessionAuth',
].reduce((exports, name) => ({
  ...exports,
  [name]: require(`./${name}`),
}), {});
