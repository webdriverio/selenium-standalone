const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
/**
 * Returns proxy agent if exist.
 * @param {string} url
 * @returns {any}
 */
function getProxtAgent(url) {
  if (url.startsWith('http:') && process.env.HTTP_PROXY) {
    const httpProxyAgent = new HttpProxyAgent(process.env.HTTP_PROXY);
    return { agent: { http: httpProxyAgent } };
  }
  if (url.startsWith('https:') && process.env.HTTPS_PROXY) {
    const httpProxyAgent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
    return { agent: { https: httpProxyAgent } };
  }
  return {};
}
module.exports = { getProxtAgent };
