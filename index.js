module.exports = process.env.COW_COV
  ? require('./lib-cov')
  : require('./lib');
