'use strict';

let api = {};
exports = module.exports = api;



function createOnRenewal(app, rightDocument, renewal, user, dtstart, dtend, nbdays, timeCreated) {

    let save = app.getService('user/requests/save');

    let params = { // parameters given to the service
        user: user._id,
        createdBy: user,
        timeCreated: timeCreated,
        absence: {
            distribution: [
                {
                    events: [{
                        dtstart: dtstart,
                        dtend: dtend
                    }],
                    quantity: nbdays,
                    right: {
                        id: rightDocument._id,
                        renewal:renewal._id
                    }
                }
            ]
        }
    };

    return save.getResultPromise(params);
}



/**
 * Create a request on renewal
 *
 * @param 	{Express}	app   App or headless mock app
 * @param   {RightRenewal} renewal
 * @param   {User} user  Appliquant
 * @param   {Date} dtstart
 * @param   {Date} dtend
 * @param   {Int} nbdays
 *
 * @return {Promise}
 */
api.createAbsenceOnRenewal = function(app, renewal, user, dtstart, dtend, nbdays) {

    return renewal.getRightPromise()
    .then(rightDocument => {
        return createOnRenewal(app, rightDocument, renewal, user, dtstart, dtend, nbdays);
    });
};



/**
 * Create random absence request for one user on the first right found
 * using the user/requests service
 *
 * @param 	{Express}	app   App or headless mock app
 * @param   {User} user  Appliquant
 * @param   {Date} dtstart
 * @param   {Date} dtend
 * @param   {Int} nbdays
 *
 * @return {Promise}
 */
api.createRandomAbsence = function(app, user, dtstart, dtend, nbdays, timeCreated) {

    function createOnRight(rightDocument) {
        return rightDocument.getPeriodRenewal(dtstart, dtend)

        .then(renewal => {

            if (!renewal) {
                return null;
            }

            return createOnRenewal(app, rightDocument, renewal, user, dtstart, dtend, nbdays, timeCreated);

        });
    }


    /**
     * @return {Promise}
     */
    function loop(rights) {

        if (rights.length === 0) {
            throw new Error('no rights with renewal on user '+user._id+' '+user.getName());
        }

        return createOnRight(rights[0])
        .then(result => {
            if (null === result) {
                rights.shift();
                return loop(rights);
            }
            return result;
        });
    }



    if (!nbdays) {
        nbdays = 1;
    }

    if (!user.roles.account) {
        throw new Error('This user is not an account');
    }



    return user.getAccount()
    .then(account => {

        if (!account) {
            throw new Error('This user is not an account');
        }

        return account.getRights()
        .then(rights => {

            if (rights.length < 1) {
                throw new Error('No rights associated to the user');
            }

            if (!dtstart) {
                dtstart = new Date();
            }

            if (!dtend) {
                dtend = new Date(dtstart);
                dtend.setDate(dtend.getDate()+nbdays);
            }

            return loop(rights);
        });
    });



};
