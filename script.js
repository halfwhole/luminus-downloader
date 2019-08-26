'use strict';

const puppeteer = require('puppeteer');
const url = require('url');
const fs = require('fs');

const Module = require('./directory').Module;
const Folder = require('./directory').Folder;
const File = require('./directory').File;

const SECRET_FILE = 'secret.txt';
const NUM_MODULES = 6;
const PRINT = true;

async function main() {
    const usernamePassword = readUsernamePassword();
    const username = usernamePassword['username'];
    const password = usernamePassword['password'];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await moveToLumiNUS(page, PRINT);
    await login(page, username, password);

    let modulePromises = [];
    for (let modulePos = 0; modulePos < NUM_MODULES; modulePos++) {
        const modulePromise = getModule(browser, modulePos);
        modulePromises.push(modulePromise);
    }

    const modules = await Promise.all(modulePromises);

    for (const module of modules) {
        console.log();
        module.print();
    }

    await browser.close();
}

// Sets up and closes a new page for getting a module.
// Pre-condition: the user must already be logged in
// Returns: a Module;
async function getModule(browser, modulePos) {
    const modulePage = await browser.newPage();
    await moveToLumiNUS(modulePage);
    await moveToModules(modulePage);
    const moduleInfo = await getModuleInfo(modulePage, modulePos);
    const moduleCode = moduleInfo['moduleCode'];
    const moduleName = moduleInfo['moduleName'];

    await moveToModule(modulePage, modulePos);
    await moveToFiles(modulePage);

    const module = await exploreModule(modulePage, moduleCode, moduleName);
    await modulePage.close();
    return module;
}

function readUsernamePassword() {
    try {
        const data = fs.readFileSync(SECRET_FILE, 'utf8').toString();
        const username = data.split('\n')[0];
        const password = data.split('\n')[1];
        return { 'username': username, 'password': password };
    } catch (e) {
        throw 'Could not read username and password from secret.txt, terminating.';
    }
}

async function moveToLumiNUS(page, print = false) {
    if (print) process.stdout.write('Accessing LumiNUS ... ');
    await page.goto('https://luminus.nus.edu.sg/');
    if (print) console.log('done!');
}

// Pre-condition: the page is at the LumiNUS login page
// Logs the user in using 'username' and 'password', throwing an error if login fails
async function login(page, username, password) {
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

// Pre-condition: the page is at the dashboard
async function moveToModules(page) {
    await page.waitForSelector('.my-modules');
    await page.evaluate(() => document.querySelector('.my-modules').click());
    await page.waitForNavigation();
}

// Pre-condition: the page is at 'My Modules'
// Moves to the module with position 'pos'
async function moveToModule(page, pos) {
    await page.waitForSelector('.module-card');
    await page.evaluate(pos => document.querySelectorAll('.module-card')[pos].click(), pos);
    await page.waitForNavigation();
}

/*
async function getModulesInfo(page, print = false) {
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

// Pre-condition: the page is at 'My Modules'
async function getModuleInfo(page, modulePos, print = false) {
    await page.waitForSelector('.module-card');
    const moduleCard = (await page.$$('.module-card'))[modulePos];
    const moduleCode = await moduleCard.$eval('.module-code', elem => elem.innerText);
    const moduleName = await moduleCard.$eval('h4', elem => elem.innerText);
    return { 'moduleCode': moduleCode, 'moduleName': moduleName };
}

// Pre-condition: the page has the navbar on the left, with a tab named 'Files'
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

// Pre-condition: the page is at the main folder page of a 'Files' tab
// Returns: a Module
async function exploreModule(page, moduleCode, moduleName) {
    const foldersFiles = await exploreFolderPage(page, moduleCode);
    const folders = foldersFiles['folders'];
    const files = foldersFiles['files'];
    const module = new Module(moduleCode, moduleName, folders);
    if (PRINT) console.log('Done with ' + moduleCode);
    return module;
}


// Pre-condition: the page is at the sub-folder you wish to explore
// Returns: a Folder
async function exploreFolder(page, folderName, folderStatus) {
    const foldersFiles = await exploreFolderPage(page, folderName);
    const folders = foldersFiles['folders'];
    const files = foldersFiles['files'];
    const folder = new Folder(folderName, folderStatus, files, folders);
    return folder;
}

// Pre-condition: the page is at the folder you wish to explore
// Returns: an object with array of folders, and an array of files
async function exploreFolderPage(page, descriptor) {
    if (PRINT) console.log('Exploring ' + descriptor + ' ...');
    const folders = await getFolders(page);
    const files = await getFiles(page);
    return { 'folders': folders, 'files': files };
}

// Returns: an array of folders
async function getFolders(page) {
    let folders = [];
    // TODO: Handle open folders only
    await page.waitForSelector('list-view-item');

    const folderGroup = await page.$('div.folders');
    if (folderGroup === null) return folders;

    // Filter for indices of folders that are not submission folders
    const folderItems = await folderGroup.$$('list-view-item');
    const promises = await folderItems.map(item => item.$('icon[name=submissionFolder]'));
    const outcomes = await Promise.all(promises);
    const filteredFolderIndices = [...folderItems.keys()].filter(i => outcomes[i] === null);
    if (filteredFolderIndices === null) return folders;


    for (let itemPos of filteredFolderIndices) {
        const folderItem = folderItems[itemPos];
        const folderName = await folderItem.$eval('.filename', elem => elem.innerText);
        const folderStatusElem = await folderItem.$('folder-status');
        const folderStatus = await folderStatusElem.$eval('span', elem => elem.innerText);

        // Enter the folder
        await page.$$('list-view-item');
        await page.evaluate(folderPos => {
            document.querySelector('div.folders')
                    .querySelectorAll('list-view-item')[folderPos]
                    .click();
        }, itemPos);
        await page.waitForNavigation();

        const folder = await exploreFolder(page, folderName, folderStatus);
        folders.push(folder);

        // Exit the folder
        await page.goBack();
        await page.waitForNavigation();
    }

    return folders;
}

// Returns: an array of files
async function getFiles(page) {
    let files = [];

    const fileGroup = await page.$('div.files');
    if (fileGroup === null) return files;

    const fileItems = await fileGroup.$$('list-view-item');
    await page.waitForSelector('.filename'); // Just for safety: remove?
    await page.waitForSelector('div.user');  // Just for safety: remove?

    for (let itemPos = 0; itemPos < fileItems.length; itemPos++) {
        const fileItem = fileItems[itemPos];
        const fileName = await fileItem.$eval('.filename', elem => elem.innerText);
        const lastModifiedBy = await fileItem.$eval('div.user', elem => elem.innerText);
        const file = new File(fileName, lastModifiedBy);
        files.push(file);
    }

    return files;
}

main()
.then(() => process.exit(0))
.catch(e => {
    console.log(e);
    process.exit(1);
});

