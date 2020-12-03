module.exports = checkPathsExistence;

const fs = require('fs');

function checkPathsExistence(paths, opts, cb) {
  const pathValues = Object.keys(paths).map((key) => {
    return paths[key];
  });

  Promise.all(
    pathValues.map(
      (path) =>
        new Promise((resolve, reject) => {
          fs.exists(path, (res) => {
            if (res === false) {
              return reject(new Error('Missing ' + path));
            }

            resolve();
          });
        })
    )
  )
    .then(() => cb(undefined, opts))
    .catch((err) => cb(err));
}
