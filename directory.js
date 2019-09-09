// folders should be [] if empty
class Module {
    constructor(code, name, folders) {
        this.code = code;
        this.name = name;
        this.folders = folders;
    }
    // 'diff' is a flag indicating if everything in the module should be printed,
    // or only files and folders that are different
    print(diff = false) {
        console.log(this.toString());
        this.folders.forEach(folder => folder.print(0, diff));
    }
    toString() {
        return this.code + ': ' + this.name;
    }
}

// files and folders should be [] if empty
class Folder {
    constructor(name, folderStatus, files, folders) {
        this.name = name;
        this.folderStatus = folderStatus;
        this.files = files;
        this.folders = folders;
    }
    print(level, diff = false) {
        if (!diff || this.anyDiff()) console.log(this.toString(level));
        this.folders.forEach(folder => folder.print(level + 1, diff));
        this.files.forEach(file => file.print(level + 1, diff));
    }
    // Tells you if this folder or any of its children files or folders are recursively diff
    anyDiff() {
        if (this.diff) return true;
        const anyFileDiff = this.files.some(file => file.diff);
        if (anyFileDiff) return true;
        const anyFolderDiff = this.folders.some(folder => folder.anyDiff());
        if (anyFolderDiff) return true;
        return false;
    }
    toString(level) {
        return '  '.repeat(level) + '* ' + this.name + ' (' + this.folderStatus + ')'
            + (this.diff ? ' [new]' : '');
    }
}

class File {
    constructor(name, lastModifiedBy) {
        this.name = name;
        this.lastModifiedBy = lastModifiedBy;
    }
    print(level, diff) {
        if (!diff || this.diff) console.log(this.toString(level));
    }
    toString(level) {
        return '  '.repeat(level) + '* ' + this.name + ' (last modified by: '
            + this.lastModifiedBy + ')' + (this.diff ? ' [new]' : '');
    }
}

module.exports = { Module, Folder, File };

