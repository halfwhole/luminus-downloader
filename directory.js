class Module {
    constructor(id, code, name) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.folders = [];
    }
    populateFolders(folders) {
        this.folders = folders;
    }
    // 'diff' is a flag indicating if everything in the module should be printed,
    // or only files and folders that are different
    printString(diff = false) {
        return this.toString() + '\n'
            + this.folders.map(folder => folder.printString(0, diff)).filter(x => x).join('\n');
    }
    // Tells you if anything in the module is diff
    anyDiff() {
        if (this.diff) return true;
        const anyFolderDiff = this.folders.some(folder => folder.anyDiff());
        if (anyFolderDiff) return true;
        return false;
    }
    toString() {
        return this.code + ': ' + this.name;
    }
}

class Folder {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.folders = [];
        this.files = [];
    }
    populateFolders(folders) {
        this.folders = folders;
    }
    populateFiles(files) {
        this.files = files;
    }
    printString(level, diff = false) {
        let result = '';
        if (!diff || this.anyDiff()) result += this.toString(level) + '\n';
        result += this.folders.map(folder => folder.printString(level + 1, diff)).filter(x => x).join('\n');
        result += this.files.map(file => file.printString(level + 1, diff)).filter(x => x).join('\n');
        return result;
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
        return '  '.repeat(level) + '* ' + this.name + (this.diff ? ' [new]' : '');
    }
}

class File {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    printString(level, diff) {
        return (!diff || this.diff) ? this.toString(level) : '';
    }
    toString(level) {
        return '  '.repeat(level) + '* ' + this.name + (this.diff ? ' [new]' : '');
    }
}

module.exports = { Module, Folder, File };
