const { readPrint } = require('./config');

const PRINT = readPrint();

// Entry point for comparing two lists of modules
// Compares a list of modules with another list of matching modules
// First module list will be marked with 'diff' (LumiNUS), second module list won't (local)
function compareModules(moduleList1, moduleList2) {
    for (const module1 of moduleList1) {
        const module2 = moduleList2.filter(module2 => module1.code === module2.code)[0];
        if (module2 === undefined) {
            if (PRINT) console.log('Could not find matching module for ' + module1.code);
        } else {
            compareTwoFoldersOrModules(module1, module2);
        }
    }
}

// Compares files and folders that are in folder1 but not in folder2, marking new ones as 'diff'
function compareTwoFoldersOrModules(folder1, folder2) {
    // Mark diff files
    const folder1files = folder1.files || [];
    const folder2files = folder2.files || [];
    const diffFiles = folder1files.filter(folder1file => {
        return !folder2files.map(f => f.name).some(fName => fName === folder1file.name);
    });
    diffFiles.forEach(file => file.diff = true);

    // Mark diff folders -- also recursively mark each item in it as 'diff'
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

// Recursively marks the 'diff' property of all its folders and files to be true
function markDiffFolders(folder) {
    folder.diff = true;
    folder.files.forEach(file => file.diff = true);
    folder.folders.forEach(folder => markDiffFolders(folder));
}

// Gets the print string for modules (for display)
function modulesPrintString(modules) {
    let printString = '';
    let nothingNew = true;
    for (const module of modules) {
        const moduleDiff = module.anyDiff();
        if (!moduleDiff) continue;
        printString += '\n';
        nothingNew = false;
        printString += module.printString(true);
    }
    if (nothingNew) {
        printString += 'No new files or folders!';
    }
    return printString;
}

module.exports = { compareModules, modulesPrintString };
