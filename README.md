# Setting up

### `CONFIG.txt`

Copy the file `CONFIG_EXAMPLE.txt` into a new file `CONFIG.txt`.

Replace the following fields accordingly:
* `username` NUSNET username
* `password` NUSNET password
* `directory_path` Path of your local directory to compare to LumiNUS, *relative to your home directory*
* `print` Whether you want to display extra information or not -- either `true` or `false`

### `MODULES.txt`

Copy the file `MODULES_EXAMPLE.txt` into a new file `MODULES.txt`.

Each line should be present for each module that appears in your LumiNUS module board. It should be in the format `<LumiNUS module name>: <Local folder name>`. This helps to map the LumiNUS module to your local folder.

# Running the script

Run `npm install`, then run the main script using `node main.js`.

### Sample output

Files and folders that are in LumiNUS but not your local directory are marked with `[new]`:

```
Accessing LumiNUS ... done!
Logging in ... done!
Please wait as LumiNUS loads ...

Exploring USPRA101 ...
Done with USPRA101, no folders found
Exploring CS2106 ...
Done with CS2106
Exploring CS2104 ...
Done with CS2104
Exploring MA2216/ST2131 ...
Done with MA2216/ST2131
Exploring CS3230 ...
Done with CS3230
Exploring CS2103/CS2103T ...
Done with CS2103/CS2103T
Exploring UQF2101I ...
Done with UQF2101I

USPRA101: Cinnamon College (AY2019/20 - Semester 1)

CS2106: Introduction to Operating Systems
* Labs (Open)
  * lab2.pdf (last modified by: Cristina Carbunaru) [new]
  * lab2.tar.gz (last modified by: Cristina Carbunaru) [new]
* Lecture Notes (Open)
  * L4 - IPC.pdf (last modified by: Cristina Carbunaru) [new]
  * L5 - Process Alternative - Threads.pdf (last modified by: Cristina Carbunaru) [new]

CS2104: Programming Language Concepts
* Tutorials + Assignments (Open)
  * Tut3.hs (last modified by: Chin Wei Ngan) [new]
  * Tut1ans.hs (last modified by: Chin Wei Ngan) [new]
  * Lab01-with-err.hs (last modified by: Chin Wei Ngan) [new]

MA2216/ST2131: Probability
* Homework and Tutorial Questions (Open)
  * Tutorial 2 Soln.pdf (last modified by: Sun Rongfeng) [new]

CS3230: Design and Analysis of Algorithms

CS2103/CS2103T: Software Engineering
* Handouts (Open)
  * L4.pptx (last modified by: Damith C. Rajapakse) [new]

UQF2101I: QUANTITATIVE REASONING FOUNDATION: QUANTIFYING ENVIRONMENTAL QUALITY
```
