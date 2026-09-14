const { json, readSession, config, userInterfaces } = require('../lib.js');

module.exports = function handler(req, res) {
  const cfg = config();
  const session = readSession(req) || {};
  return json(res, 200, {
    ok: true,
    configured: Boolean(cfg.appKey && cfg.accessSecret && cfg.redirectUri),
    callbackConfigured: Boolean(cfg.redirectUri),
    authorized: Boolean(session.token),
    appId: cfg.appId,
    redirectUri: cfg.redirectUri,
    profile: session.profile || null,
    stateVerified: session.stateVerified == null ? null : session.stateVerified,
    expiresAt: session.expiresAt || null,
    error: session.error || null,
    interfaces: userInterfaces,
  });
};
