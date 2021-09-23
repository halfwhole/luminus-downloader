# LumiNUS Downloader

This downloader compares your local directory to LumiNUS, and pulls all new
files and folders from LumiNUS into the appropriate location in your local
directory.

## Setting up

There is one file you first have to set up: `MODULES.txt`

In the `config` directory, copy the file `MODULES_EXAMPLE.txt` into a new file `MODULES.txt`.

Each line should be present for each module you have in your local directory.
It should be in the format `<LumiNUS module name>: <Local folder name>`.
This helps to map the LumiNUS module to your local folder.

## Running the script

Ensure that you have 7-Zip available, through `sudo apt install p7zip-full` or `brew install p7zip`.

Run `npm install`, then run the main script using `node main.js`.

Then, if you are a first-time user, enter the following details (the program will automatically save these details to `/config/CONFIG.yaml`)
* `username` NUSNET username
* `password` NUSNET password
* `directory_path` Path of your local directory for LumiNUS files, *relative to your home directory*


Options:
- `--silent` or `-s`: No printing (apart from errors)
- `--timeout` or `-t`: Timeout per request in ms, defaults to 5000
- `--no-save` or `-n`: Will not save your credentials and preferred directory to a local file
- `--reset-configuration` or `-r`: Reset credentials and preferred directory

![Example of running the script](./example.gif)

## Contributions

Contributions are welcome! If you have any issues or suggestions, feel free raise them in the [issue tracker](https://github.com/halfwhole/luminus-downloader/issues), or open a pull request directly.
