const crypto = require('crypto');
const unzip = require('unzipper');
const path = require('path');
const fs = require('fs');

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
    await writeItem(buffer, file_name, base_path);
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
    await writeItem(buffer, folder_name + '.zip', base_path);
    // Unzip folder
    return new Promise((resolve, reject) => {
        const zip_folder_path = path.join(base_path, folder_name + '.zip');
        const temp_folder_name = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');
        const temp_folder_path = path.join(base_path, temp_folder_name);
        const unzipExtractor = unzip.Extract({ path: temp_folder_path });
        fs.createReadStream(zip_folder_path).pipe(unzipExtractor);
        // TODO: how dirty, callback hell
        unzipExtractor.on('close', () => {
            fs.rename(path.join(temp_folder_path, folder_name), path.join(base_path, folder_name), err => {
                if (err) reject(err);
                fs.rmdir(temp_folder_path, err => {
                    if (err) reject(err);
                    fs.unlink(zip_folder_path, err => {
                        if (err) reject(err);
                        if (PRINT) console.log('Downloaded folder ' + folder_name + ' to ' + base_path);
                        resolve();
                    });
                });
            });
        });
    });
}

async function writeItem(buffer, name, base_path) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(base_path, name), buffer, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

module.exports = { downloadNewFoldersFilesInModule };
