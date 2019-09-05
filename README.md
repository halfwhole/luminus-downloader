# Guide

Copy the file `CONFIG_EXAMPLE.txt` into a new file `CONFIG.txt`.

Replace the following fields accordingly:
* `username` NUSNET username
* `password` NUSNET password
* `directory_path` Path of your local directory to compare to LumiNUS, *relative to your home directory*
* `num_modules` Number of modules you're taking (this helps to speed things up because LumiNUS can be rather slow)
* `print` Whether you want to display extra information or not -- either `true` or `false`

Run `npm install`, then run the main script using `node script.js`.

### Sample output

Files and folders that are in LumiNUS but not your local directory are marked with 'diff':

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
* Tutorials (Open)
  * T03_code.zip (last modified by: Cristina Carbunaru) (diff)
  * Tutorial03.pdf (last modified by: Cristina Carbunaru) (diff)
  * Tutorial01 - Selected Solutions.pdf (last modified by: Cristina Carbunaru) (diff)

CS2104: Programming Language Concepts
* Tutorial 1 Submission (not graded) (Open) (diff)
* Tutorials + Assignments (Open)
  * Lab01.hs (last modified by: Chin Wei Ngan) (diff)

MA2216/ST2131: Probability

CS3230: Design and Analysis of Algorithms
* Assignments (Open)
  * Assignment4.pdf (last modified by: Divesh Aggarwal) (diff)

CS2103/CS2103T: Software Engineering

UQF2101I: QUANTITATIVE REASONING FOUNDATION: QUANTIFYING ENVIRONMENTAL QUALITY
* Lecture Notes (Open)
  * Week 4 Class 2 notes (Open) (diff)
    * TableauPublicDesktop.zip (last modified by: Edmund Low) (diff)
    * Air Quality Data - QR Class (Tab) .xlsx (last modified by: Edmund Low) (diff)
    * Homework 4.pdf (last modified by: Edmund Low) (diff)
  * Week 4 Class 1 (Open) (diff)
    * Week 4 Class 1 - slides.pdf (last modified by: Edmund Low) (diff)
  * Week 3 Class 2 notes (Open) (diff)
    * Week 3 Class 2 - slides.pdf (last modified by: Edmund Low) (diff)
  * Independent Learning Assignment Slides (Open) (diff)
```
