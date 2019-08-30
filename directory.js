// folders should be [] if empty
class Module {
    constructor(code, name, folders) {
        this.code = code;
        this.name = name;
        this.folders = folders;
    }
    print() {
        console.log(this.code + ': ' + this.name);
        this.folders.forEach(folder => folder.print(0));
    }
}

// files and subFolders should be [] if empty
class Folder {
    constructor(name, folderStatus, files, subFolders) {
        this.name = name;
        this.folderStatus = folderStatus;
        this.files = files;
        this.subFolders = subFolders;
    }
    print(level) {
        console.log('  '.repeat(level) + '* ' + this.name + ' (' + this.folderStatus + ')'
            + (this.diff ? ' (diff)' : ''));
        this.subFolders.forEach(folder => folder.print(level + 1));
        this.files.forEach(file => file.print(level + 1));
    }
}

class File {
    constructor(name, lastModifiedBy) {
        this.name = name;
        this.lastModifiedBy = lastModifiedBy;
    }
    print(level) {
        console.log('  '.repeat(level) + '* ' + this.name + ' (last modified by: ' + this.lastModifiedBy + ')'
            + (this.diff ? ' (diff)' : ''));
    }
}

module.exports = { Module, Folder, File };

