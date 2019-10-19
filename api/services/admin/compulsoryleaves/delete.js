'use strict';


exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;
    const postpone = app.utility.postpone;

    /**
     * Call the compulsoryleave delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        const CompulsoryLeave = service.app.db.models.CompulsoryLeave;
        const User = service.app.db.models.User;
        let documentPromise = CompulsoryLeave.findById(params.id)
        .populate('requests.request') // for the pre remove hook
        .exec();

        let objectPromise = service.get(params.id);

        Promise.all([documentPromise, objectPromise])
        .then(all => {

            // list of users where cache must be refreshed
            let users = all[0].requests.map(clr => {
                return clr.user.id;
            });

            return all[0].remove()
            .then(() => {
                if (service.app.config.useSchudeledRefreshStat) {
                    // mark account as refreshable by the refreshstat command
                    return service.app.db.models.Account.updateMany(
                        { 'user.id': { $in: users } },
                        { $set: { renewalStatsOutofDate: true } }
                    ).exec();
                }

                return User.find()
                .where('_id').in(users)
                .exec()
                .then(users => {
                    let promises = users.map(user => {
                        return user.updateRenewalsStat(all[0].dtstart);
                    });

                    return postpone(() => Promise.all(promises));
                });
            })
            .then(() => {
                service.resolveSuccess(all[1], gt.gettext('The compulsory leave has been deleted'));
            });
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};
