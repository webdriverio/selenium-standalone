const edgePath = require('edge-paths');
const path = require('path');
const fs = require("fs")

function getInstalledEdgeBrowserVersionOnWindows() {
  var ondriverdirectory = path.dirname(edgePath.getEdgePath());
  var EdgeVersion = "85.0.564.40"; //default
  let fileNames = fs.readdirSync(ondriverdirectory)
    .filter(versionFolder => /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/g.test(versionFolder)).toString();
    
  EdgeVersion = (fileNames || EdgeVersion)
  return EdgeVersion
}

module.exports = getInstalledEdgeBrowserVersionOnWindows()