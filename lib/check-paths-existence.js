module.exports = checkPathsExistence;

const async = require('async');
const fs = require('fs');

function checkPathsExistence(paths, cb) {
  const pathValues = Object.keys(paths).map((key) => {
    return paths[key];
  });

  async.parallel(
    pathValues.map((path) => {
      return function (existsCb) {
        fs.exists(path, (res) => {
          if (res === false) {
            existsCb(new Error('Missing ' + path));
            return;
          }

          existsCb();
        });
      };
    }),
    cb
  );
}
