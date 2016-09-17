'use strict';

const helpers = require('../server/rest/mockServer');
const webshot = require('webshot');


function addWebshotMethod(server)
{
    server.webshot = function(angularPath, filename, done) {
        let o = server.getUrlOptions();
        let url = 'http://'+o.hostname+':'+o.port+'/#'+angularPath;

        let options = {
          defaultWhiteBackground: true,
          customHeaders: o.headers,
          renderDelay: 2000,
          errorIfStatusIsNot200: true,
          errorIfJSException: true,
          windowSize: {
              width: 1024,
              height: null
          },
          shotSize: {
              width: 'window',
              height: 'all'
          }
        };

        return new Promise((accept, reject) => {
            webshot(url, './test/doc/screenshots/'+filename+'.png', options, function(err) {
                if (err) {
                    return reject(err);
                }
                accept(null);
            });
        });


    };


}



exports = module.exports = {

    /**
     * Function loaded in a beforeEach to ensure the server is started for every test
     * This start only one instance
     *
     * @param {String} [dbname]     optionnal database name
     * @param {function} ready      callback
     */
    mockServer: function(dbname, ready) {
        helpers.mockServer(dbname, function(_mockServer) {
            addWebshotMethod(_mockServer);
            ready(_mockServer);
        });
    }
};
