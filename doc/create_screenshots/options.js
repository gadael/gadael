'use strict';

exports = module.exports = function() {
    return {
        defaultWhiteBackground: true,
        renderDelay: 5000,
        timeout: 100000,
        errorIfStatusIsNot200: false,
        errorIfJSException: true,
        windowSize: {
            width: 1280,
            height: 100
        },
        shotSize: {
            width: 'window',
            height: 'all'
        }
    };
};
