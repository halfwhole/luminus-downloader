'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

const { login } = require('./login');
const { exploreModules } = require('./exploreLuminusDirectory');
const { exploreLocalModules } = require('./exploreLocalDirectory');
const { compareModules } = require('./compareDirectories');
const { readDirectoryPath, readPrint } = require('./configParser');
const { downloadNewFoldersFilesInModule } = require('./downloader');

const DIRECTORY_PATH = path.join(os.homedir(), readDirectoryPath());
const PRINT = readPrint();

// TODO: need to find a way to login and retrieve authorization
const AUTH = '';

/* MOVING AND SETTING UP LUMINUS */

async function moveToLumiNUS(page, print = false) {
    if (print) process.stdout.write('Accessing LumiNUS ... ');
    await page.goto('https://luminus.nus.edu.sg/');
    if (print) console.log('done!');
}

function printDiffModules(modules) {
    let first = true;
    for (const module of modules) {
        const moduleDiff = module.anyDiff();
        if (!moduleDiff) continue;
        if (!first) console.log();
        first = false;
        module.print(true);
    }
    if (first) {
        console.log('No new files or folders!');
    }
}

/* MAIN PROCESS */

async function main() {
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await moveToLumiNUS(page, PRINT);
    // await login(page);
    // await browser.close();

    const modules = await exploreModules(AUTH);
    const localModules = exploreLocalModules(DIRECTORY_PATH);
    compareModules(modules, localModules);

    for (const module of modules) {
        await downloadNewFoldersFilesInModule(AUTH, module, DIRECTORY_PATH);
    }

    printDiffModules(modules);
}

main()
.then(() => process.exit(0))
.catch(e => {
    console.log(e);
    process.exit(1);
});

