'use strict';

const helpers = require('../server/rest/mockServer');
const webshot = require('webshot');


function addWebshotMethod(server)
{
    server.webshot = function(angularPath, done) {
        let o = server.getUrlOptions();
        let url = 'http://'+o.hostname+':'+o.port+'/#'+angularPath;

        let options = {
          defaultWhiteBackground: true,
          customHeaders: o.headers,
          renderDelay: 200,
          errorIfStatusIsNot200: true,
          errorIfJSException: true
        };

        webshot(url, './test/doc/screenshots/'+angularPath+'.png', options, function(err) {
            done(err);
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
