const sleep = (ms = 1) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  sleep,
};
