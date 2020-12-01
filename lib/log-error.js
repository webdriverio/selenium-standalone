const logError = (fnName, error, message = '') => {
  console.error(`Error in "${fnName}". ${message}\nSee more details below:`);
  if (error) {
    if (error.response) {
      console.log(error.response.statusCode, error.response.url);
    }
    console.error(error.message || error);
  }
  return error;
};

module.exports = {
  logError,
};
