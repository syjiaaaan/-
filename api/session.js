const { json, readSession } = require('./lib.js');

module.exports = function handler(req, res) {
  const session = readSession(req) || {};
  if (!session.token) {
    return json(res, 200, { authenticated: false });
  }
  return json(res, 200, {
    authenticated: true,
    mode: 'oauth',
    profile: session.profile || null,
    expiresAt: session.expiresAt || null,
  });
};
