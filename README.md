# Discord9000

A Discord bot implementation of Robot9000.

## Setup

To use this bot script, you need a MySQL instance, a Discord bot token, and Node.js (node and npm). I recommend using nvm to install node and npm. You must create a file called `.env` at the root level of the project that looks like the below example
```
DB_HOST=host.name.goes.here
DB_USER=user_name_goes_here
DB_PASSWORD=correcthorsebatterystaple
BOT_TOKEN=asdf123_qwerty.4567890uiop
```
The file `/.env` is included in `.gitignore` so your sensitive data will be safe if you use this bot, contribute to the project, and submit a pull request. If you're running this script on the same computer as your MySQL instance, the hostname you should use is probably "localhost", and if you don't know what your username is, it is probably "root".

Before running this script, you need to regenerate the `node_modules` directory, which is listed in `.gitignore` because it is just used to store the dependencies of this project. To do this, run `npm install`.

To start the script, simply `cd` to the project directory and run `node .`.

## Functionality

Every message that is posted while the bot is online will be added to the database in a table specific to the server. (Actually, it is a hash of the message.) If the bot detects that an identical message has been sent before in the same server, the message is promptly deleted. This is not exactly identical to the original Perl implementation of Robot9000, but it is in line with Randall Munroe's general idea, which was to somehow prohibit unoriginal messages.

## Design

This implementation of Robot9000 runs on Node.js and uses the mysql2 package to communicate with a MySQL instance. This script uses a single database within the MySQL instance called `discord9000`, and each server in which the bot is used is given its own table. Each server-specific table stores a base 64 SHA256 hash string of every messages that has ever been sent in the server while the bot was online. The column in which these hash strings are stored uses a hash index for very fast lookup even if a huge number of unique messages are in the table.

The benefits of storing hash strings are twofold. Firstly, every base 64 SHA256 hash string is exactly 44 characters long, so I can use a `CHAR(44)` column to store them, which makes the database more efficient and back-compatible no matter how high Discord increases the message character limit. Secondly, as SHA265 is a cryptographically secure hash, if a hacker were to ever obtain access to a database used for this bot, it would be impossible to read people's messages, adding a layer of privacy and security to this application.
