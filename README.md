# ComputerNetwork-Project

## Introduction:
This github repository contains the all the code written for a local multiplayer tic-tac-toe game. The language used is node.js, and the multiplayer aspect is implemented using user-defined sockets (no third - party involved). The game also feature SSL, implemented using OpenSSL.

## Dependencies:
1. Node.js
2. NetCat (Download nmap, do not do npm installation method as it does not work)
3. OpenSSl (Go to the OpenSSL wiki and find the link to download the windows binaries)

Make sure to add nmap and OpenSSL to your system's path.

## How to run:
Download all the code and open in your preferred coding environment, run npm install, then run the file `gameserver.js` using the command `node gameserver.js`.
If the server does not encounter any errors, you should see a message in the terminal.
Now, open two command terminal windows and run the commands `node gameclient.js`.
You should see the messages 'Welcome X' in one terminal and 'Welcome O' in the other terminal. X will move first always.
To make a move, type `move [0-8]` when it is your turn. You cannot write to already filled places.
Please note:- The board is structured as follows:<br>
0 1 2<br>
3 4 5<br>
6 7 8<br>

## How to create the SSL documents:
1. Run the command `openssl genpkey -algorithm RSA -out server-key.pem -aes256` and create a password when prompted.
2. Run the command `openssl req -new -key server-key.pem -out server-csr.pem` and fill in the details you wish to add.
3. Run the command `openssl x509 -req -days 365 -in server-csr.pem -signkey server-key.pem -out server-cert.pem`.
