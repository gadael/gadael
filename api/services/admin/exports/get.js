'use strict';

var XLSX = require('XLSX');
var Gettext = require('node-gettext');
var gt = new Gettext();
var tmp = require('tmp');

function getWorksheetData() {
    return [];
}

function datenum(v, date1904) {
	if(date1904) {
        v+=1462;
    }
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function getWorksheetFromArray(data) {
	var ws = {};
	var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
	for(var R = 0; R !== data.length; ++R) {
		for(var C = 0; C !== data[R].length; ++C) {
			if(range.s.r > R) {
                range.s.r = R;
            }
			if(range.s.c > C) {
                range.s.c = C;
            }
			if(range.e.r < R) {
                range.e.r = R;
            }
			if(range.e.c < C) {
                range.e.c = C;
            }
			var cell = {v: data[R][C] };
			if(cell.v === null) {
                continue;
            }
			var cell_ref = XLSX.utils.encode_cell({c:C,r:R});

			if(typeof cell.v === 'number') {
                cell.t = 'n';
            }
			else if (typeof cell.v === 'boolean') {
                cell.t = 'b';
            }
			else if (cell.v instanceof Date) {
				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
				cell.v = datenum(cell.v);
			} else {
                cell.t = 's';
            }

			ws[cell_ref] = cell;
		}
	}
	if(range.s.c < 10000000) {
        ws['!ref'] = XLSX.utils.encode_range(range);
    }
	return ws;
}




function getWorkbook()
{
    function Workbook() {
        if(!(this instanceof Workbook)) {
            return new Workbook();
        }
        this.SheetNames = [];
        this.Sheets = {};
    }

    let workbook = new Workbook();
    let ws_name = 'Export';

    /* add worksheet to workbook */
    workbook.SheetNames.push(ws_name);
    workbook.Sheets[ws_name] = getWorksheetFromArray(getWorksheetData());

    return workbook;
}



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

        let tmpname = tmp.tmpNameSync();
        XLSX.writeFile(getWorkbook(), tmpname);
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

        return service.deferred.promise;
    };


    return service;
};


