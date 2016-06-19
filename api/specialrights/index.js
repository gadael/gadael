'use strict';

/**
 * Special right list
 *
 */
function SpecialRightIndex() {


    this.objects = {
        rtt:                  require('./rtt'),
        timesavingaccount:    require('./timesavingaccount'),
        annualleave:          require('./annualleave')
    };
}


/**
 * Get all instances of SpecialRight
 * @returns {Object}
 */
SpecialRightIndex.prototype.getInstances = function() {

    let instances = {};

    for (let name in this.objects) {
        if (this.objects.hasOwnProperty(name)) {
            instances[name] = new this.objects[name]();
        }
    }

    return instances;
};


/**
 * Get list of special rights
 * @return {Array}
 */
SpecialRightIndex.prototype.getList = function() {
    let list = [];
    let all = this.getInstances();

    for (let name in all) {
        if (all.hasOwnProperty(name)) {
            list.push(all[name].getServiceObject());
        }
    }

    return list;
};



/**
 * Get list of special right with canCreate=true
 * @return {Array}
 */
SpecialRightIndex.prototype.getCreateList = function(RightModel) {

    if (!RightModel) {
        throw new Error('missing right model');
    }

    let list = [];
    let all = this.getInstances();


    for (let name in all) {
        if (all.hasOwnProperty(name) && all[name].canCreate(RightModel)) {
            list.push(all[name].getServiceObject());
        }
    }

    return list;
};



exports = module.exports = SpecialRightIndex;
