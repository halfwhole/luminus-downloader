# LumiNUS Downloader

This downloader compares your local directory to LumiNUS, and pulls all new
files and folders from LumiNUS into the appropriate location in your local directory.

## Setting up

### User credentials (optional)

In the `config` directory, create a file `credentials.yaml` with the following details:
* `username`: NUSNET username
* `password`: NUSNET password

If `credentials.yaml` is absent, the user will be prompted for these details, and the file will be saved automatically.

### Module mapping

In the `config` directory, copy `modules_example.yaml` into a new file `modules.yaml`. It should have the following:
- The top line should be the path of your desired local directory, *relative to your home directory*.
  This is where all your LumiNUS modules will be stored.
- Each of the following lines should map one LumiNUS module to its corresponding sub-folder in your local directory.
  A line should have the format `<LumiNUS module name>: <Local sub-folder name>`.

## Running the script

Ensure that you have 7-Zip available, through `sudo apt install p7zip-full` or `brew install p7zip`.

Run `npm install`, then run the main script using `node main.js`.

Options:
- `--silent` or `-s`: No printing (apart from errors)
- `--timeout` or `-t`: Timeout per request in ms, defaults to 5000
- `--no-save` or `-n`: Will not save your login credentials to a local file
- `--reset-credentials` or `-r`: Reset login credentials

![Example of running the script](./example.gif)

## Contributions

Contributions are welcome! If you have any issues or suggestions, feel free raise them in the [issue tracker](https://github.com/halfwhole/luminus-downloader/issues), or open a pull request directly.
