const debug = require('debug');

module.exports = {
  info: console.info,
  error: console.error,
  debug: debug('sq-web-pay'),
};
