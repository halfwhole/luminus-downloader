const fs = require('fs');
const url = require('url');

const { readUsername, readPassword, readPrint } = require('./configParser');

const PRINT = readPrint();

// Pre-condition: the page is at the LumiNUS login page
// Logs in the user, throwing an error if the login fails
async function login(page) {
    const username = readUsername()
    const password = readPassword();

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

