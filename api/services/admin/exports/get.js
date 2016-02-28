'use strict';

let xlsx = require('xlsx-writestream');
let Gettext = require('node-gettext');
let gt = new Gettext();
let tmp = require('tmp');






exports = module.exports = function(services, app) {

    var service = new services.get(app);



    /**
     * Get data for each export type
     */
    let exportTypes = {

        /**
         * Get balance on date
         * @param {Object} params
         * @returns {Promise}
         */
        balance: function(params) {

            return new Promise(function(resolve, reject) {
                if (undefined === params.moment) {
                    return reject(gt.gettext('moment is a mandatory parameter'));
                }

                resolve(require('./balance')(service, params.moment));
            });


        },

        /**
         * All requests between two dates
         * @param {Object} params
         * @returns {Promise}
         */
        requests: function(params) {

            return new Promise(function(resolve, reject) {

                if (undefined === params.from || undefined === params.to) {
                    return reject(gt.gettext('from and to are mandatory parameters'));
                }

                resolve(require('./requests')(service, params.from, params.to));
            });
        }
    };






    /**
     * Call the export get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        let format = 'xlsx';

        if (undefined !== params.format && -1 !== ['xlsx', 'csv'].indexOf(params.format)) {
            format = params.format;
        }

        let type = 'balance';
        if (undefined !== params.type && -1 !== ['balance', 'requests'].indexOf(params.type)) {
            type = params.type;
        }


        exportTypes[type](params).then(function(data) {

            let tmpname = tmp.tmpNameSync();
            xlsx.write(tmpname, data, function (err) {
                if (err) {
                    return service.deferred.reject(err);
                }

                service.res.download(tmpname, 'export.xlsx', function(err){
                    if (err) {
                        // Handle error, but keep in mind the response may be partially-sent
                        // so check res.headersSent
                        service.deferred.reject(err);

                    } else {
                        // do not return json after download
                        service.deferred.resolve(null);
                    }
                });
            });

        }).catch(service.error);


        return service.deferred.promise;
    };


    return service;
};


