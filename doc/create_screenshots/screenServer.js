'use strict';

const helpers = require('../../test/server/rest/mockServer');
const webshot = require('webshot');
const getOptions = require('./options');
const sharp = require('sharp');

function addWebshotMethod(server, languageCode)
{
    server.webshot = function(angularPath, filename, done) {
        let o = server.getUrlOptions();
        let url = 'http://'+o.hostname+':'+o.port+'/#'+angularPath;
        let options = getOptions();
        options.customHeaders = o.headers;

        return new Promise((resolve, reject) => {
            webshot(url, './doc/screenshots/'+languageCode+'/'+filename+'.png', options, function(err) {
                if (err) {
                    return reject(err);
                }

                resolve(true);
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
            ready(_mockServer).catch(err => {
                console.error(err);
                console.log(err.stack);
            });
        }, countryCode, languageCode);
    }
};
