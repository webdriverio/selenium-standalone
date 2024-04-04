module.exports = { validateMajorVersionPrefix, getVersionWithZeroedPatchPart };

/**
 * Returns the major version number or ''.
 * @param {string} possibleMajorPrefix
 * @returns {string}
 */
function validateMajorVersionPrefix(possibleMajorPrefix) {
  let prefix;

  if (possibleMajorPrefix) {
    prefix = possibleMajorPrefix.match(/^[+-]?([0-9]+)/);
  }
  return prefix && prefix.length > 0 ? prefix[0] : '';
}

/**
 * @param {string} fullVersion
 * @return {string}
 */
function getVersionWithZeroedPatchPart(fullVersion) {
  if (!/^\d+\.\d+\.\d+$/i.test(fullVersion)) {
    // If version longer than just 3 numbers, like '4.0.0-beta-1', do nothing
    return fullVersion;
  }
  // else make version patch part zero: '4.1.1' => '4.1.0'
  const [major, minor] = fullVersion.split('.');
  return `${major}.${minor}.0`;
}
