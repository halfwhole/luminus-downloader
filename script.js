'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');

const { Module, Folder, File } = require('./directory');

const SECRET_FILE_PATH = 'secret.txt';
const DIRECTORY_PATH = 'Documents/AY2S1/';
const NUM_MODULES = 7;
const PRINT = true;
// TODO: Allow custom module mappings for names


/* EXPLORE LOCAL DIRECTORY */


// Returns: an array of Folders, and an array of Files
function exploreLocalFoldersFiles(folderPath) {
    const dirents = fs.readdirSync(folderPath, { withFileTypes: true })
    const folderNames = dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    const fileNames = dirents
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name);

    const folders = folderNames.map(folderName => {
        return exploreLocalFolder(folderPath, folderName);
    });
    const files = fileNames.map(fileName => {
        return new File(fileName);
    });

    return { 'folders': folders, 'files': files };
}

// Returns: a Folder
function exploreLocalFolder(folderPath, folderName) {
    const newPath = path.join(folderPath, folderName);
    const localFoldersFiles = exploreLocalFoldersFiles(newPath);
    const folders = localFoldersFiles['folders'];
    const files = localFoldersFiles['files'];
    return new Folder(folderName, '', files, folders);
}

// Returns: a Module
function exploreLocalModule(folderPath, moduleCode) {
    const newPath = path.join(folderPath, moduleCode);
    const localFoldersFiles = exploreLocalFoldersFiles(newPath);
    const folders = localFoldersFiles['folders'];
    return new Module(moduleCode, '', folders);
}

function exploreLocalModules(folderPath) {
    const dirents = fs.readdirSync(folderPath, { withFileTypes: true })
    const moduleCodes = dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    const modules = moduleCodes.map(moduleCode => {
        return exploreLocalModule(folderPath, moduleCode);
    });
    return modules;
}


/* COMPARE TWO DIRECTORIES */


// Compares a list of modules with another list of matching modules.
// Entry point of comparison
function compareModules(moduleList1, moduleList2) {
    for (const module1 of moduleList1) {
        const module2 = moduleList2.filter(module2 => module2.code === module1.code)[0];
        if (module2 === undefined) {
            console.log('Could not find matching module for ' + module1.code);
        } else {
            compareTwoFoldersOrModules(module1, module2);
        }
    }
}

// Compares files and folders that are in folder1 but not in folder2, marking new ones as `diff`
function compareTwoFoldersOrModules(folder1, folder2) {
    // Mark diff files
    const folder1files = folder1.files || [];
    const folder2files = folder2.files || [];
    const diffFiles = folder1files.filter(folder1file => {
        return !folder2files.map(f => f.name).some(fName => fName === folder1file.name);
    });
    diffFiles.forEach(file => file.diff = true);

    // Mark diff folders -- also recursively mark each item in it as diff
    const folder1folders = folder1.folders || [];
    const folder2folders = folder2.folders || [];
    const diffFolders = folder1folders.filter(folder1folder => {
        return !folder2folders.map(f => f.name).some(fName => fName === folder1folder.name);
    });
    diffFolders.forEach(folder => markDiffFolders(folder));

    // Explore non-diff folders
    const nonDiffFolders = folder1folders.filter(folder1folder => {
        return folder2folders.map(f => f.name).some(fName => fName === folder1folder.name);
    });

    nonDiffFolders.forEach(folder1subfolder => {
        const folder2subfolder = folder2folders.filter(folder2folder => {
            return folder2folder.name === folder1subfolder.name;
        })[0];
        compareTwoFoldersOrModules(folder1subfolder, folder2subfolder);
    });
}

// Recursively marks the `diff` property of all its folders and files to be true
function markDiffFolders(folder) {
    folder.diff = true;
    folder.files.forEach(file => file.diff = true);
    folder.folders.forEach(folder => markDiffFolders(folder));
}


/* MAIN FUNCTION */


async function main() {
    const usernamePassword = readUsernamePassword();
    const username = usernamePassword['username'];
    const password = usernamePassword['password'];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await moveToLumiNUS(page, PRINT);
    await login(page, username, password);

    let modules = [];
    // We don't use async here, because LumiNUS can't handle the load :/
    for (let modulePos = 0; modulePos < NUM_MODULES; modulePos++) {
        const module = await getModule(browser, modulePos);
        modules.push(module);
    }

    console.log();

    const localModules = exploreLocalModules(path.join(os.homedir(), DIRECTORY_PATH));
    compareModules(modules, localModules);

    for (const module of modules) {
        console.log();
        module.print(true);
    }

    await browser.close();
}


/* MOVING AND SETTING UP LUMINUS */


// Sets up and closes a new page for getting a module.
// Pre-condition: the user must already be logged in
// Returns: a Module
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
        const data = fs.readFileSync(SECRET_FILE_PATH, 'utf8').toString();
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


/* EXPLORE LUMINUS DIRECTORY */


// Pre-condition: the page is at the main folder page of a 'Files' tab
// Returns: a Module
async function exploreModule(page, moduleCode, moduleName) {
    if (PRINT) console.log('Exploring ' + moduleCode + ' ...');

    // If a module has no files/folders, return an empty module
    const content = await page.waitForSelector('#content');
    if (await page.$('p.empty') !== null &&
        await page.$eval('p.empty', elem => elem.innerText) === 'No folders.') {
        if (PRINT) console.log('Done with ' + moduleCode + ', no folders found');
        return new Module(moduleCode, moduleName, []);
    }

    // If a module has files/folders, explore it further
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
    const folders = await getFolders(page);
    const files = await getFiles(page);
    return { 'folders': folders, 'files': files };
}

// Returns: an array of folders
// NOTE: filters out folders that aren't open, or are submission folders
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


/* MAIN PROCESS */


main()
.then(() => process.exit(0))
.catch(e => {
    console.log(e);
    process.exit(1);
});

