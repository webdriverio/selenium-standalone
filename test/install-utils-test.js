const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const tarStream = require('tar-stream');
const {
  createDirs,
  setDriverFilePermissions,
  getTempFileName,
  uncompressGzippedFile,
} = require('../lib/install-utils');

describe('install-utils', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'selenium-standalone-test-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates parent directories for install paths', async () => {
    const nestedFile = path.join(tmpDir, 'drivers', 'chrome', 'chromedriver');
    await createDirs({
      chrome: { installPath: nestedFile },
    });

    const stat = await fs.promises.stat(path.dirname(nestedFile));
    assert.strictEqual(stat.isDirectory(), true);
  });

  it('sets executable permissions on driver file when needed', async () => {
    const driverFile = path.join(tmpDir, 'driver-bin');
    await fs.promises.writeFile(driverFile, '#!/bin/sh\necho ok\n', { mode: 0o644 });

    await setDriverFilePermissions(driverFile);

    if (process.platform !== 'win32') {
      await fs.promises.access(driverFile, fs.constants.R_OK | fs.constants.X_OK);
    }
  });

  it('uncompresses a plain .gz file', async () => {
    const gzPath = path.join(tmpDir, 'driver.gz');
    const expectedContent = 'mock-driver-binary-content';
    await fs.promises.writeFile(gzPath, zlib.gzipSync(Buffer.from(expectedContent)));

    await uncompressGzippedFile('https://example.com/driver.gz', gzPath);

    const extracted = await fs.promises.readFile(path.join(tmpDir, 'driver'), 'utf8');
    assert.strictEqual(extracted, expectedContent);
  });

  it('uncompresses a .tar.gz archive', async () => {
    const tarGzPath = path.join(tmpDir, 'geckodriver.gz');
    const expectedContent = 'mock-geckodriver-binary';
    const pack = tarStream.pack();
    pack.entry({ name: 'geckodriver' }, expectedContent);
    pack.finalize();

    await new Promise((resolve, reject) => {
      const gzip = zlib.createGzip();
      const out = fs.createWriteStream(tarGzPath);
      pack.pipe(gzip).pipe(out).on('finish', resolve).on('error', reject);
    });

    await uncompressGzippedFile('https://example.com/geckodriver.tar.gz', tarGzPath);

    const extracted = await fs.promises.readFile(path.join(tmpDir, 'geckodriver'), 'utf8');
    assert.strictEqual(extracted, expectedContent);
  });

  it('generates temp file names with the requested suffix', () => {
    const name = getTempFileName('installer.log');
    assert.strictEqual(name.endsWith('installer.log'), true);
  });
});
