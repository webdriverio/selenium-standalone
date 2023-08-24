const os = require('os');

function detectBrowserPlatformInternal(wantedArchitecture) {
  const platform = os.platform();
  switch (platform) {
    case 'darwin': {
      if (wantedArchitecture) {
        return wantedArchitecture === 'arm64' ? 'mac-arm64' : 'mac-x64';
      }
      return os.arch() === 'arm64' ? 'mac-arm64' : 'mac-x64';
    }
    case 'linux': {
      return 'linux';
    }
    case 'win32': {
      if (wantedArchitecture) {
        return wantedArchitecture === 'x64' || (wantedArchitecture === 'arm64' && isWindows11(os.release()))
          ? 'win32'
          : 'win64';
      }
      return os.arch() === 'x64' || (os.arch() === 'arm64' && isWindows11(os.release())) ? 'win32' : 'win64';
    }
    default:
      return undefined;
  }
}

function isWindows11(version) {
  const parts = version.split('.');
  if (parts.length > 2) {
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patch = parseInt(parts[2], 10);
    return major > 10 || (major === 10 && minor > 0) || (major === 10 && minor === 0 && patch >= 22000);
  }
  return false;
}

function getArhType(platform) {
  switch (platform) {
    case 'linux':
      return 'linux64';
    case 'mac-arm64':
      return 'mac-arm64';
    case 'mac_arm':
      return 'mac-arm64';
    case 'mac':
      return 'mac-x64';
    case 'mac-x64':
      return 'mac-x64';
    case 'win32':
      return 'win32';
    case 'win64':
      return 'win64';
  }
}

function detectBrowserPlatformCustom(arh) {
  return arh ? detectBrowserPlatformInternal(arh) : detectBrowserPlatformInternal();
}

function getChromiumEdgeDriverArchitectureOld(wantedArchitecture, version) {
  let platform;

  if (process.platform === 'linux') {
    platform = 'linux64';
  } else if (process.platform === 'darwin') {
    if (process.arch === 'arm64') {
      const [major] = version.split('.');
      platform = parseInt(major, 10) > 104 ? 'mac64_m1' : 'mac64';
    } else {
      platform = 'mac64';
    }
  } else if (wantedArchitecture === 'x32') {
    platform = 'win32';
  } else {
    platform = 'win64';
  }

  return platform;
}

function getChromeDriverArchitectureOld(wantedArchitecture, version) {
  let platform;

  if (process.platform === 'linux') {
    platform = 'linux64';
  } else if (process.platform === 'darwin') {
    const arch = wantedArchitecture || process.arch;

    if (arch === 'arm64') {
      const [major] = version.split('.');
      platform = parseInt(major, 10) > 105 ? 'mac_arm64' : 'mac64_m1';
    } else {
      platform = 'mac64';
    }
  } else {
    platform = 'win32';
  }

  return platform;
}

function getIeDriverArchitectureOld(wanted) {
  let platform;

  if (wanted === 'ia32') {
    platform = 'Win32';
  } else {
    platform = 'x64';
  }

  return platform;
}

function getFirefoxDriverArchitectureOld(wantedArchitecture) {
  const extension = '.tar.gz';

  switch (process.platform) {
    case 'linux':
      return getLinuxFirefoxDriverArchitectureOld(extension, wantedArchitecture);
    case 'darwin':
      return getMacFirefoxDriverArchitectureOld(extension);
    case 'win32':
      return getWindowsFirefoxDriverArchitectureOld(wantedArchitecture);
    default:
      throw new Error('No Firefox driver is available for platform "' + process.platform + '"');
  }
}

function getLinuxFirefoxDriverArchitectureOld(extension, wantedArchitecture = 'x64') {
  const arch = wantedArchitecture === 'x64' ? '64' : '32';
  return 'linux' + arch + extension;
}

function getMacFirefoxDriverArchitectureOld(extension) {
  return 'macos' + (process.arch === 'arm64' ? '-aarch64' : '') + extension;
}

function getWindowsFirefoxDriverArchitectureOld(wantedArchitecture = '64') {
  const arch = wantedArchitecture.substr(-2) === '64' ? '64' : '32';

  return `win${arch}.zip`;
}

module.exports = {
  detectBrowserPlatformCustom,
  getArhType,
  getChromiumEdgeDriverArchitectureOld,
  getChromeDriverArchitectureOld,
  getIeDriverArchitectureOld,
  getFirefoxDriverArchitectureOld,
};
