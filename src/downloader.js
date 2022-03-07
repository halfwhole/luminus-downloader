const crypto = require('crypto');
const unzip = require('unzipper');
const path = require('path');
const fs = require('fs');
const Seven = require('node-7z');

const { readPrint } = require('./config');
const { downloadFileAPI, downloadFolderAPI } = require('./api');

const PRINT = readPrint();

// Entry point
// Downloads all new folders and files in the module
async function downloadNewFoldersFilesInModule(auth, module, base_path) {
    const new_path = path.join(base_path, module.code);
    await downloadNewFolders(auth, module.folders, new_path);
}

async function downloadNewFoldersFilesInFolder(auth, folder, base_path) {
    const new_path = path.join(base_path, folder.name);
    await downloadNewFolders(auth, folder.folders, new_path);
    await downloadNewFiles(auth, folder.files, new_path);
}

async function downloadNewFolders(auth, folders, path) {
    const downloadPromises = folders.map(folder => {
        if (folder.diff) {
            return downloadFolder(auth, folder.id, folder.name, path);
        } else {
            // Recursively explores non-different folders for new children
            return downloadNewFoldersFilesInFolder(auth, folder, path);
        }
    });
    await Promise.all(downloadPromises);
}

async function downloadNewFiles(auth, files, path) {
    const downloadPromises = files.filter(file => file.diff).map(file => {
        return downloadFile(auth, file.id, file.name, path);
    });
    await Promise.all(downloadPromises);
}

/* HELPER FUNCTIONS FOR DOWNLOADING AND WRITING FILES/FOLDERS */

async function downloadFile(auth, file_id, file_name, base_path) {
    let buffer;
    try {
        buffer = await downloadFileAPI(auth, file_id);
    } catch (err) {
        if (PRINT) console.log("File '" + file_name +"' could not be downloaded.");
        return;
    }
    const file_path = path.join(base_path, file_name);
    await writeFile(buffer, file_path);
    if (PRINT) console.log('Downloaded file ' + file_name + ' to ' + base_path);
}

async function downloadFolder(auth, folder_id, folder_name, base_path) {
    let buffer;
    try {
        buffer = await downloadFolderAPI(auth, folder_id);
    } catch (err) {
        if (PRINT) console.log("Folder '" + folder_name + "' could not be downloaded.");
        return;
    }
    folder_name = folder_name.replace(/\//g, ':');  // Replace forward slashes that can mess up the zip file path
    const zip_file_path = path.join(base_path, folder_name + '.zip');
    await writeFile(buffer, zip_file_path);
    await fixBackSlashedZipFile(zip_file_path);
    await extractZipFile(zip_file_path, base_path);
    await deleteFile(zip_file_path);
    if (PRINT) console.log('Downloaded folder ' + folder_name + ' to ' + base_path);
}

/* HELPER FUNCTIONS FOR FILES */

async function writeFile(buffer, file_path) {
    return new Promise((res, rej) => {
        fs.writeFile(file_path, buffer, (err) => {
            if (err) rej(err);
            res();
        });
    });
}

function deleteFile(file_path) {
    return new Promise((res, rej) => {
        fs.unlink(file_path, err => {
            if (err) rej(err);
            res();
        });
    });
}

/* HELPER FUNCTIONS FOR 7ZIP */

// EDIT: As of 19/08/20, this function is no longer necessary as a fix has been applied by LumiNUS. Comments below are outdated.
//       I'll still keep the function here though as a safeguard.
// Converts backslashes to forward slashes in .zip files, to make it work with Unix systems
// This function is necessary because downloaded LumiNUS .zip folders contain backslashes in their file names
async function fixBackSlashedZipFile(zip_file_path) {
    function getZipFilenames(zip_file_path) {
        const myStream = Seven.list(zip_file_path);
        return new Promise((res, rej) => {
            let filenames = [];
            myStream.on('data', (chunk) => {
                filenames.push(chunk['file']);
            });
            myStream.on('end', () => {
                res(filenames);
            });
        });
    }

    function renameZipFilenames(zip_file_path, renamings) {
        return new Promise((res, rej) => {
            const myStream = Seven.rename(zip_file_path, renamings);
            myStream.on('end', () => res());
        });
    }

    const forwardSlashedFilenames = await getZipFilenames(zip_file_path);
    const backForwardSlashedFilenames = forwardSlashedFilenames.map(fname => [fname.replace(/\//g, '\\'), fname]);
    await renameZipFilenames(zip_file_path, backForwardSlashedFilenames);
}

function extractZipFile(zip_file_path, dest_path) {
    return new Promise((res, rej) => {
        const myStream = Seven.extractFull(zip_file_path, dest_path, { recursive: true });
        myStream.on('end', () => res());
    });
}


module.exports = { downloadNewFoldersFilesInModule };
