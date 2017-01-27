'use strict';

exports.getUserImage = function(req, res) {


    if (!req.isAuthenticated()) {
        return res.status(401).end('401 Unauthorized');
    }



    let User = req.app.db.models.User;
    User.findOne({ _id: req.params.userid })
    .select('image')
    .exec()
    .then(user => {

        if (null === user) {
            return res.status(404).end('404 Not Found');
        }

        if (!user.image) {
            return res.download('styles/default-user.png');
        }

        const head = user.image.substr(0, 25);
        const meta = head.match(/data:(image\/\w+);base64,/i);

        if (null === meta) {
            return res.status(500).end('500 Internal Server Error');
        }

        let encodedData = user.image.substr(meta[0].length);
        let image = new Buffer(encodedData, 'base64');

        res.contentType(meta[1]);
        res.end(image);
    });
};
