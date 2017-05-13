'use strict';
const url = require('url');
const getProxy = require('get-proxy');
const tunnelAgent = require('tunnel-agent');

module.exports = (proxy, opts) => {
	proxy = proxy || getProxy();
	opts = Object.assign({}, opts);

	if (typeof proxy === 'object') {
		opts = proxy;
		proxy = getProxy();
	}

	if (!proxy) {
		return null;
	}

	proxy = url.parse(proxy);

	const uriProtocol = opts.protocol === 'https' ? 'https' : 'http';
	const proxyProtocol = proxy.protocol === 'https:' ? 'Https' : 'Http';
	const port = proxy.port || (proxyProtocol === 'Https' ? 443 : 80);
	const method = `${uriProtocol}Over${proxyProtocol}`;

	delete opts.protocol;

	return tunnelAgent[method](Object.assign({
		proxy: {
			port,
			host: proxy.hostname,
			proxyAuth: proxy.auth
		}
	}, opts));
};
