'use strict';

var xlsx = require('xlsx-writestream');
var Gettext = require('node-gettext');
var gt = new Gettext();
var tmp = require('tmp');


exports = module.exports = function(services, app) {

    var service = new services.get(app);

    /**
     * Call the export get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (undefined === params.from || undefined === params.to) {
            return service.error(gt.gettext('from and to are mandatory parameters'));
        }

        let type = 'xlsx';

        if (undefined !== params.type && -1 !== ['xlsx', 'csv'].indexOf(params.type)) {
            type = params.type;
        }


        let data = [];

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



        return service.deferred.promise;
    };


    return service;
};


