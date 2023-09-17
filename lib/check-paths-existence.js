const fs = require('fs');

const checkPathsExistence = (paths) => {
  const pathValues = Object.values(paths);

  pathValues.forEach((path) => {
    if (!fs.existsSync(path)) {
      throw new Error('Missing ' + path);
    }
  });
};

module.exports = checkPathsExistence;
