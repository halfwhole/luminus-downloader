const { readUsername, readPassword, readPrint, readTimeout } = require('./config');
const prompt = require('prompt-sync')();

require('ssl-root-cas')
    .inject()
    .addFile(process.cwd() + '/nus-edu-sg-chain.pem');

const url = require('url');
const qs = require('querystring');
const axios = require('axios').create({
    timeout: readTimeout(),
    maxRedirects: 0,                          // intercept 302 redirects
    validateStatus: (status) => status < 500, // also allow 302 redirects, not only 2xx
});

const VAFS_URL = 'https://vafs.nus.edu.sg/adfs/oauth2/authorize?' +
                 'response_type=code&' +
                 'client_id=E10493A3B1024F14BDC7D0D8B9F649E9-234390&' +
                 'redirect_uri=https%3A%2F%2Fluminus.nus.edu.sg%2Fauth%2Fcallback&' +
                 'resource=sg_edu_nus_oauth';
const VAFS_PARAMS = {
    AuthMethod: 'FormsAuthentication'
};

const ADFS_TOKEN_URL = 'https://luminus.nus.edu.sg/v2/api/login/adfstoken';
const ADFS_TOKEN_PARAMS = {
    grant_type: 'authorization_code',
    client_id: 'E10493A3B1024F14BDC7D0D8B9F649E9-234390',
    resource: 'sg_edu_nus_oauth',
    redirect_uri: 'https://luminus.nus.edu.sg/auth/callback'
};

async function makeAxiosGet(url, cookies='') {
    const res = await axios.get(url, { headers: { Cookie: cookies } });
    return finishAxiosRequest(res);
}

async function makeAxiosPost(url, params) {
    const res = await axios.post(url, qs.stringify(params));
    return finishAxiosRequest(res);
}

function finishAxiosRequest(res) {
    const setCookies = res.headers['set-cookie'];
    const newCookies = (setCookies === undefined)
        ? undefined
        : setCookies.map(c => c.split('; ')[0]).join('; ');
    const location = res.headers.location;
    return [res, newCookies, location];
}

function getUsername() {
    try {
	return readUsername();
    } catch (e) {
	return prompt('Username: ');
    }
}

function getPassword() {
    try {
	return readPassword();
    } catch (e) {
	return prompt.hide('Password: ');
    }
}

// Logs in the user, throwing an error if the login fails
// Returns: a promise with the access token
async function login() {
    const username = getUsername();
    const password = getPassword();
    const login_params = { ...VAFS_PARAMS, UserName: username, Password: password };
    if (readPrint()) process.stdout.write('Logging into LumiNUS ... ');

    let res, cookies, location;
    [res, cookies, location] = await makeAxiosPost(VAFS_URL, login_params);   // 302
    if (res.status !== 302) {
        throw 'Login credentials invalid. To reset your credentials, use option -r or edit the user credentials file.';
    }
    [res, cookies, location] = await makeAxiosGet(location, cookies=cookies); // 302
    [res, _______, ________] = await makeAxiosGet(location, cookies=cookies); // 200

    const queryString = url.parse(res.config.url).query;
    const code = qs.parse(queryString).code;
    const adfs_params = { ...ADFS_TOKEN_PARAMS, code };

    [res, ________, ________] = await makeAxiosPost(ADFS_TOKEN_URL, adfs_params); // 200

    const access_token = res.data.access_token;
    if (access_token === undefined) throw 'Login failed, please try again. LumiNUS sucks sometimes.';
    if (readPrint()) console.log('done!');
    return 'Bearer ' + access_token;
}

module.exports = { login };
