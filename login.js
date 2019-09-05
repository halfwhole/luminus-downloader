const fs = require('fs');
const url = require('url');

const PRINT = true; // TODO: not good to redefine, put in a separate config
const SECRET_FILE_PATH = 'secret.txt';

// Pre-condition: the page is at the LumiNUS login page
// Logs the user by retrieving the username and password, throwing an error if login fails
async function login(page) {
    function readUsernamePassword() {
        try {
            const data = fs.readFileSync(SECRET_FILE_PATH, 'utf8').toString();
            const username = data.split('\n')[0];
            const password = data.split('\n')[1];
            return { 'username': username, 'password': password };
        } catch (e) {
            throw 'Could not read username and password from secret.txt, terminating.';
        }
    }

    const usernamePassword = readUsernamePassword();
    const username = usernamePassword['username'];
    const password = usernamePassword['password'];

    await page.waitForSelector('.homepage');
    await page.click('.btn-login');

    await page.waitForSelector('#loginForm');
    const userNameInput = await page.$('#userNameInput');
    const passwordInput = await page.$('#passwordInput')
    await userNameInput.type(username);
    await passwordInput.type(password);
    await passwordInput.press('Enter');

    if (PRINT) process.stdout.write('Logging in ... ');
    const response = await page.waitForNavigation();
    const success = url.parse(page.url()).host === 'luminus.nus.edu.sg';
    if (!success) {
        throw 'Login invalid. Please check your login credentials again.';
    }
    if (PRINT) {
        console.log('done!');
        console.log('Please wait as LumiNUS loads ...');
        console.log();
    }
}

module.exports = { login };

