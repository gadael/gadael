'use strict';

/**
 * Export lunchs breaks quantity for a month
 * @param {apiService} service
 * @param {Date}       month
 * @return {Promise}           Promised data is the array compatible with xlsx-writestream
 */
exports = module.exports = function(service, month) {

    const gt = service.app.utility.gettext;

    const NAME       = gt.gettext('Name');
    const DEPARTMENT = gt.gettext('Department');
    const QUANTITY   = gt.gettext('Quantity');

    if (!month || 'undefined' === month) {
        return Promise.reject(new Error('missing month parameter'));
    }

    month = new Date(month);
    const end = new Date(month);
    end.setMonth(end.getMonth() +1);

    return service.app.db.models.Lunch.aggregate()
    .match({ day: { $gte: month, $lt: end } })
    .group({
        _id: '$user.id',
        count: { $sum: 1 },
        name: { $first: '$user.name' }
    })
    .sort({ '_id': 1 })
    .exec()
    .then(aggRows => {
        return Promise.all(aggRows.map(agg => {
            return service.app.db.models.User.findOne()
            .where('_id', agg._id)
            .populate('department')
            .exec()
            .then(user => {
                const row = {};
                row[NAME]       = agg.name;
                row[DEPARTMENT] = user ? user.getDepartmentName() : '';
                row[QUANTITY]   = agg.count;
                return row;
            });
        }));
    });

};
