'use strict';

const sharp = require('sharp');
const fs = require('fs');
const imageSize = require('image-size');

/**
 * Screenshoot post-processing
 * @return {Promise}
 */
exports = module.exports = function(filepathFull, filepath)
{
    return new Promise((resolve, reject) => {

        imageSize(filepathFull, (err, size) => {

            let maxHeight = size.height;
            if (maxHeight > 1000) {
                maxHeight = 1000;
            }

            sharp(filepathFull)
            .extract({ left: 0, top: 0, width: size.width, height: maxHeight })
            .resize(800)
            .png({
                compressionLevel: 9
            })
            .toFile(filepath, (err, info) => {
                if (err) {
                    return reject(err);
                }

                fs.unlink(filepathFull);
                resolve(true);
            });
        });
    });


};
