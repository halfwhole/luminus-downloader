const puppeteer = require('puppeteer');
const url = require('url');

const { readUsername, readPassword, readPrint } = require('./configParser');

const PRINT = readPrint();

// Logs in the user, throwing an error if the login fails
// Returns: a promise with the auth code
async function login() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Move to LumiNUS
    if (PRINT) process.stdout.write('Logging into LumiNUS ... ');
    await page.goto('https://luminus.nus.edu.sg/');

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

    await page.waitForNavigation();
    const success = url.parse(page.url()).host === 'luminus.nus.edu.sg';
    if (!success) {
        throw 'Login invalid. Please check your login credentials again.'
    }

    // Listen to requests for API auth code
    await page.setRequestInterception(true);
    return new Promise((resolve, reject) => {
        page.on('request', async (request) => {
            if (request.url() === 'https://luminus.nus.edu.sg/v2/api/user/Profile?populate=photo,groupId,userRole') {
                await browser.close();
                if (PRINT) console.log('done!\n');
                resolve(request.headers()['authorization']);
            } else {
                request.continue();
            }
        });
    });
}

module.exports = { login };
