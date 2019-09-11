const request = require('request');
const API_BASE = 'https://luminus.nus.edu.sg/v2/api/';

// Helper function
// Returns a promise with the body of a GET request directed to API_BASE + path
function getAPI(auth, path) {
    const options = {
        headers: { 'Authorization': auth },
        uri: API_BASE + path,
        method: 'GET'
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) return reject(res.statusMessage);
            resolve(JSON.parse(body)['data']);
        })
    });
}

module.exports = { getAPI };
