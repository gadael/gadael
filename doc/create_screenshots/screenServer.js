'use strict';

const helpers = require('../../test/server/rest/mockServer');
const webshot = require('webshot');


function addWebshotMethod(server, languageCode)
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

        console.log(filename+' start');

        return new Promise((accept, reject) => {

            webshot(url, './doc/screenshots/'+languageCode+'/'+filename+'.png', options, function(err) {
                if (err) {
                    return reject(err);
                }

                console.log(filename+' done');
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
     * @param {String} countryCode  Database will be initialized with this country UK|FR|...
     * @param {String} languageCode en|fr|...
     * @param {function} ready      callback
     */
    screenServer: function(dbname, countryCode, languageCode, ready) {

        helpers.mockServer(dbname, function(_mockServer) {
            addWebshotMethod(_mockServer, languageCode);
            ready(_mockServer).catch(console.error);
        }, countryCode, languageCode);
    }
};
