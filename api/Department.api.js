'use strict';

var api = {};
exports = module.exports = api;


/**
 * Create random department
 *
 * @param {Express} app
 * @param {String} parent
 * @param {String} [name]
 *
 * @return {Promise}
 */
api.create = function(app, parent, name, operator) {

    var Charlatan = require('charlatan');
    var DepartmentModel = app.db.models.Department;
    var department = new DepartmentModel();

    department.name = name || Charlatan.Commerce.department();
    department.parent = parent;

    if (undefined !== operator) {
        department.operator = operator;
    }

    return department.save();
};
