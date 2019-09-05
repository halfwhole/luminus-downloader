'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

const { Module, Folder, File } = require('./directory');
const { login } = require('./login');
const { exploreModule } = require('./exploreLuminusDirectory');
const { exploreLocalModules } = require('./exploreLocalDirectory');
const { compareModules } = require('./compareDirectories');
const { readDirectoryPath, readNumModules, readPrint } = require('./configParser');

const DIRECTORY_PATH = readDirectoryPath();
const NUM_MODULES = readNumModules();
const PRINT = readPrint();
// TODO: Allow custom module mappings for names


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

async function moveToLumiNUS(page, print = false) {
    if (print) process.stdout.write('Accessing LumiNUS ... ');
    await page.goto('https://luminus.nus.edu.sg/');
    if (print) console.log('done!');
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


/* MAIN PROCESS */


async function main() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await moveToLumiNUS(page, PRINT);
    await login(page);

    let modules = [];
    // We don't use async here, because LumiNUS can't handle the load :/
    for (let modulePos = 0; modulePos < NUM_MODULES; modulePos++) {
        const module = await getModule(browser, modulePos);
        modules.push(module);
    }

    if (PRINT) console.log();

    const localModules = exploreLocalModules(path.join(os.homedir(), DIRECTORY_PATH));
    compareModules(modules, localModules);

    if (PRINT) console.log();

    let first = true;
    for (const module of modules) {
        if (!first) console.log();
        first = false;
        module.print(true);
    }

    await browser.close();
}


main()
.then(() => process.exit(0))
.catch(e => {
    console.log(e);
    process.exit(1);
});

