'use strict';

const puppeteer = require('puppeteer');
const url = require('url');
const fs = require('fs');

const SECRET_FILE = 'secret.txt';
const NUM_MODULES = 5; // Change to 6 when we can deal with UQF2101I (nested folders and files)

async function main() {
    // Read username and password
    let username, password;
    try {
        const data = fs.readFileSync(SECRET_FILE, 'utf8').toString();
        username = data.split('\n')[0];
        password = data.split('\n')[1];
    } catch (e) {
        console.log('Could not read username and password from secret.txt, terminating.')
        return;
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await moveToLumiNUS(page, true);

    const success = await login(page, username, password, true);
    if (!success) return;

    let directory = [];
    // TODO: Make me async
    for (let modulePos = 0; modulePos < NUM_MODULES; modulePos++) {
        const modulePage = await browser.newPage();
        await moveToLumiNUS(modulePage);
        await moveToModules(modulePage);
        const module = await getModule(modulePage, modulePos);
        const moduleCode = module['moduleCode'];
        const moduleName = module['moduleName'];

        console.log('Exploring ' + moduleCode + ' ...');
        await moveToModule(modulePage, modulePos);
        await moveToFiles(modulePage);

        const folders = await exploreFolders(modulePage, true);
        const moduleDirectory = {
            'moduleCode': moduleCode,
            'moduleName': moduleName,
            'folders': folders
        }
        await modulePage.close();
        console.log('Done with ' + moduleCode);
        directory.push(moduleDirectory);
    }
    printDirectory(directory);

    await browser.close();
}

async function moveToLumiNUS(page, print = false) {
    if (print) console.log('Retrieving LumiNUS home page ...');
    await page.goto('https://luminus.nus.edu.sg/');
}

// Returns a boolean indicating if you've successfully logged in to LumiNUS
// Assumes that you're on the LumiNUS login page
async function login(page, username, password, print = false) {
    await page.waitForSelector('.homepage');
    await page.click('.btn-login');

    if (print) console.log('Retrieving NUS login page ...');
    await page.waitForSelector('#loginForm');
    const userNameInput = await page.$('#userNameInput');
    const passwordInput = await page.$('#passwordInput')
    await userNameInput.type(username);
    await passwordInput.type(password);
    await passwordInput.press('Enter');

    if (print) console.log('Logging in ...');
    const response = await page.waitForNavigation();
    const success = url.parse(page.url()).host === 'luminus.nus.edu.sg';
    if (success) {
        if (print) console.log('Successfully logged into LumiNUS!\n');
    } else {
        if (print) console.log('Login invalid. Please check your login credentials again.')
    }
    return success;
}

async function moveToModules(page, print = false) {
    await page.waitForSelector('.my-modules');
    if (print) console.log('Moving to your modules ...');
    await page.evaluate(() => document.querySelector('.my-modules').click());
    await page.waitForNavigation();
}

async function moveToModule(page, pos, print = false) {
    if (print) console.log('Moving to module ... ');
    await page.waitForSelector('.module-card');
    await page.evaluate(pos => document.querySelectorAll('.module-card')[pos].click(), pos);
    await page.waitForNavigation();
}

/*
async function getModules(page, print = false) {
    await page.waitForSelector('.module-card');
    const moduleCards = await page.$$('.module-card');
    let modules = [];
    for (const moduleCard of moduleCards) {
        const moduleCode = await moduleCard.$eval('.module-code', elem => elem.innerText);
        const moduleName = await moduleCard.$eval('h4', elem => elem.innerText);
        modules.push({ 'moduleCode': moduleCode, 'moduleName': moduleName });
    }
    if (print) console.log(modules.length + ' modules found');
    return modules;
}
*/

async function getModule(page, modulePos, print = false) {
    await page.waitForSelector('.module-card');
    const moduleCard = (await page.$$('.module-card'))[modulePos];
    const moduleCode = await moduleCard.$eval('.module-code', elem => elem.innerText);
    const moduleName = await moduleCard.$eval('h4', elem => elem.innerText);
    return { 'moduleCode': moduleCode, 'moduleName': moduleName };
}

async function moveToFiles(page, print = false) {
    await page.waitForSelector('course-module-tool');
    const tabs = await page.$$('course-module-tool');
    let fileTabPos = -1;
    for (let i = 0; i < tabs.length; i++) {
        const name = await tabs[i].$eval('a', elem => elem.innerText);
        if (name === 'Files') fileTabPos = i;
    }
    await page.evaluate(fileTabPos => {
        document.querySelectorAll('course-module-tool')[fileTabPos].querySelector('a').click();
    }, fileTabPos);
    await page.waitForNavigation();
}

/* Exploring folder and file structure */

async function exploreFolders(page, print = false) {
    // We find folders by finding list-view-item, then .filename and folder-status within
    if (print) console.log('Exploring folders ...');
    await page.waitForSelector('list-view-item');

    // Filter for folders that are not submission folders
    const items = await page.$$('list-view-item');
    const promises = await items.map(item => item.$('icon[name=submissionFolder]'));
    const outcomes = await Promise.all(promises);
    const filtered_items = items.filter((item, index) => outcomes[index] === null);

    let folders = [];
    for (let i = 0; i < filtered_items.length; i++) {
        const item = filtered_items[i];
        const folderName = await item.$eval('.filename', elem => elem.innerText);
        const folderStatusElem = await item.$('folder-status');
        const folderStatus = await folderStatusElem.$eval('span', elem => elem.innerText);
        const files = await exploreFiles(page, i, print);
        folders.push({
            'folderName': folderName,
            'folderStatus': folderStatus,
            'files': files
        });
    }
    return folders;
}

// Here, we enter the folder and then exit it, restoring page to the folder view page
async function exploreFiles(page, folderPos, print = false) {
    // We find files by finding list-view-item, then div.user within
    if (print) console.log('Exploring files ... ')
    await page.evaluate(folderPos => {
        document.querySelectorAll('list-view-item')[folderPos].click();
    }, folderPos);
    await page.waitForNavigation();
    await page.waitForSelector('list-view-item');
    await page.waitForSelector('.filename');
    await page.waitForSelector('div.user');

    const items = await page.$$('list-view-item');
    let files = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const fileName = await item.$eval('.filename', elem => elem.innerText);
        const lastModifiedBy = await item.$eval('div.user', elem => elem.innerText);
        files.push({ 'fileName': fileName, 'lastModifiedBy': lastModifiedBy });
    }
    await page.goBack();
    await page.waitForNavigation();
    return files;
}

/*
Layout:
{
    moduleCode: ___,
    moduleName: ___,
    folders: {
        folderName: ___,
        folderStatus: ___,
        files: {
            fileName: ___,
            lastModifiedBy: ___
        }
    }
}
*/
function printDirectory(directory) {
    let first = true;
    for (const module of directory) {
        if (!first) console.log();
        first = false;
        const moduleCode = module['moduleCode'];
        const moduleName = module['moduleName'];
        const folders = module['folders'];
        console.log(moduleCode + ': ' + moduleName);
        for (const folder of folders) {
            const folderName = folder['folderName'];
            const folderStatus = folder['folderStatus'];
            const files = folder['files'];
            console.log('* ' + folderName + ' (' + folderStatus + ')');
            for (const file of files) {
                const fileName = file['fileName'];
                const lastModifiedBy = file['lastModifiedBy'];
                console.log('  * ' + fileName + ' (last modified by ' + lastModifiedBy + ')');
            }
        }
    }
}

main().then(() => {
    process.exit(0);
});

