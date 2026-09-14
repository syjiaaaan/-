const { json, clearSession } = require('../lib.js');

module.exports = function handler(req, res) {
  clearSession(res);
  return json(res, 200, { ok: true });
};
