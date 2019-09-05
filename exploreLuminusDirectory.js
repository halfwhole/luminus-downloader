const { Module, Folder, File } = require('./directory');

const PRINT = true; // TODO: not good to redefine, put in a separate config

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

module.exports = { exploreModule };

