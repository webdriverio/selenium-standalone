const { checkArgs } = require('../lib/check-args');
const { expect } = require('chai');

describe('checkArgs', () => {
  it('returns an empty object when opts is not provided', () => {
    expect(checkArgs('fn')).to.eql({});
  });

  it('returns an empty object when opts is null', () => {
    expect(checkArgs('fn', null)).to.eql({});
  });

  it('returns an empty object when opts is undefined', () => {
    expect(checkArgs('fn', undefined)).to.eql({});
  });

  it('returns a shallow copy of opts when provided', () => {
    /** @type {import('../lib/start').StartOptions} */
    const opts = { version: '4.18.0', javaArgs: [] };

    const actual = checkArgs('fn', opts);

    expect(actual === opts).to.be.false;
    expect(actual).to.eql(opts);
    expect(actual.javaArgs === opts.javaArgs).to.be.true;
  });
});
