module.exports = checkPathsExistence;

const fse = require('fs-extra');

async function checkPathsExistence(paths) {
  const pathValues = Object.keys(paths).map((key) => {
    return paths[key];
  });

  return Promise.all(
    pathValues.map(async (path) => {
      if (!(await fse.pathExists(path))) {
        throw new Error('Missing ' + path);
      }
    })
  );
}
