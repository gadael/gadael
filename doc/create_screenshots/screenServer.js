'use strict';

const helpers = require('../../test/server/rest/mockServer');
const webshot = require('webshot');
const getOptions = require('./options');
const sharp = require('sharp');
const fs = require('fs');

function addWebshotMethod(server, languageCode)
{
    server.webshot = function(angularPath, filename, done) {
        let o = server.getUrlOptions();
        let url = 'http://'+o.hostname+':'+o.port+'/#'+angularPath;
        let options = getOptions();
        options.customHeaders = o.headers;

        return new Promise((resolve, reject) => {
            let filepathFull = './doc/screenshots/'+languageCode+'/'+filename+'.full.png';
            let filepath = './doc/screenshots/'+languageCode+'/'+filename+'.png';

            webshot(url, filepathFull, options, function(err) {
                if (err) {
                    return reject(err);
                }

                sharp(filepathFull)
                .resize(600)
                .toFile(filepath, (err, info) => {
                    if (err) {
                        return reject(err);
                    }

                    fs.unlink(filepathFull);
                    resolve(true);
                });

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
