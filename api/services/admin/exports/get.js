'use strict';

const xlsx = require('xlsx-writestream');
const Gettext = require('node-gettext');
const gt = new Gettext();
const tmp = require('tmp');






exports = module.exports = function(services, app) {

    let service = new services.get(app);



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
     * @return {Promise}    Resolve to a temporary file
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
            xlsx.write(tmpname, data, err => {
                if (err) {
                    return service.deferred.reject(err);
                }

                service.deferred.resolve(tmpname);
            });

        }).catch(service.error);


        return service.deferred.promise;
    };


    return service;
};


