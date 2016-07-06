module.exports = isInstalled;

var async = require('async');
var crypto = require('crypto');
var fs = require('fs');
var request = require('request');

function isInstalled(file, url, cb) {
  async.series([
    checksum.bind(null, file),
    etag.bind(null, url)
  ], function (error, results) {
    if (error) {
      return cb(error);
    }

    return cb(null, results[0] === results[1]);
  });
}

function checksum(filepath, cb) {
  if (!fs.existsSync(filepath)) {
    return cb();
  }

  var hash = crypto.createHash('md5');
  var stream = fs.createReadStream(filepath);

  stream.on('data', function (data) {
    hash.update(data, 'utf8');
  }).on('end', function () {
    cb(null, hash.digest('hex'));
  }).once('error', cb);
}

function etag(url, cb) {
  request.head(url, {followAllRedirects: true}).on('response', function (res) {
    if (res.statusCode !== 200) {
      return cb(new Error('Could not request headers from ' + url + ': ', res.statusCodestatusCode));
    }

    cb(null, unquote(res.headers.etag));
  }).once('error', function (err) {
    cb(new Error('Could not request headers from ' + url + ': ' + err));
  });
}

function unquote(str, quoteChar) {
  quoteChar = quoteChar || '"';

  if (str[0] === quoteChar && str[str.length - 1] === quoteChar) {
    return str.slice(1, str.length - 1);
  }

  return str;
}
