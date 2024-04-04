const { expect } = require('chai');
const { validateMajorVersionPrefix } = require('../lib/validation');

describe('validateMajorVersionPrefix', () => {
  it('Given an empty string it should return an empty string', () => {
    const actual = validateMajorVersionPrefix('');
    const expected = '';

    expect(actual).to.eql(expected);
  });

  it('Given an input that is not a version number it should return an empty string', () => {
    const actual = validateMajorVersionPrefix('adsf');
    const expected = '';

    expect(actual).to.eql(expected);
  });
});
