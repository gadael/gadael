'use strict';


const webshot = require('webshot');
const https = require('https');
const querystring = require('querystring');
const getOptions = require('./options');



/**
 * Screenshot on gadael.com
 * @param {String} languageCode     language code to use in path
 */
exports = module.exports = function site(languageCode) {

    let headers = {};
    let sessionCookie;

    const testAccount = {
        dbname: 'documentation',
        lastname: 'Doe',
        firstname: 'John',
        email: 'john.doe@gadael.com',
        //password: Math.random().toString(36).slice(-8)
        password: 'ab012#cd458',
        legal: '1'
    };


    /**
     * Take one screenshot
     * @param {String} path             Path without the language
     * @param {String} filename         Filename to use without extension
     * @return {Promise}
     */
    function shotcom(path, filename) {
        let url = 'https://www.gadael.com/'+languageCode+'/'+path;

        if (sessionCookie) {
            headers.Cookie = sessionCookie;
        }

        let options = getOptions();
        options.customHeaders = headers;

        return new Promise((resolve, reject) => {
            //console.log('screen '+url);
            webshot(url, './doc/screenshots/'+languageCode+'/saas-'+filename+'.png', options, function(err) {
                if (err) {
                    return reject(err);
                }

                resolve(true);
            });
        });
    }




     function getUrlOptions(method, query, path, data) {

         let reqHeaders = {};

        if (undefined === method) {
            method = 'GET';
        }

        if (undefined === headers) {
            headers = {};
        }

        if (undefined === query) {
            query = {};
        }

        if (undefined === path) {
            path = '';
        }


        if (data) {
            reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
            reqHeaders['Content-Length'] = Buffer.byteLength(data);
        }

        if (sessionCookie) {
            reqHeaders.Cookie = sessionCookie;
        }

        if (Object.getOwnPropertyNames(query).length !== 0) {

            path += '?'+querystring.stringify(query);
        }

        return {
            hostname: 'www.gadael.com',
            port: 443,
            path: path,
            method: method,
            agent: false,
            headers: reqHeaders
        };

    }



    /**
     * Request with session cookie if cookie set by previous request
     */
    function request(method, query, path, data) {

        return new Promise((resolve, reject) => {

            let postData = querystring.stringify(data);


            let options = getUrlOptions(method, query, path, postData);
            //console.log(options);
            var req = https.request(options, function(res) {

                // grab session cookie to set in browser
                if (res.headers['set-cookie']) {
                    res.headers['set-cookie'].forEach(function(cookieStr) {
                        //console.log('Raw set-cookie '+cookieStr);
                        sessionCookie = cookieStr.split(';')[0];
                        //console.log('Set new session cookie '+server.sessionCookie);
                    });
                }

                res.setEncoding('utf8');

                let body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    //console.log(res.statusCode+' '+path);
                    resolve(body);
                });
            });

            if (postData) {
                req.write(postData);
            }

            req.end();
        });
    }


    function createAccount() {
        return request('POST', {}, '/fr/local-signup', testAccount);
    }


    function deleteAccount() {
        return request('POST', {}, '/fr/deleteaccount', {});
    }

    function checkStatus() {
        return request('GET', {}, '/session')
        .then(body => {
            let session = JSON.parse(body);
            if (!session.isLoggedIn) {
                throw new Error('Not logged in');
            }
            return true;
        });
    }



    return shotcom('signup/', 'signup')
    .then(() => {
        return createAccount()
        .then(checkStatus)
        .then(() => {
            // screenshot private space
            return shotcom('account/', 'app-start')
            .then(shotcom('account/company-settings/', 'company-settings'));
        });

    }).then(deleteAccount);

};
