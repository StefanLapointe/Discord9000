import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { Client, GatewayIntentBits } from "discord.js";
import crypto from "crypto";

const result = dotenv.config();

// exit process if dotenv.config() failed or if there are missing keys
const requiredKeys = ["DB_HOST", "DB_USER", "DB_PASSWORD", "BOT_TOKEN"];
if (result.error || !requiredKeys.every(key => key in process.env)) {
    console.log("Error: \".env\" file is missing or faulty");
    process.exit(1);
}

// establish connection to MySQL
// use a pool to avoid timeout
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// ensure that the discord9000 database exists and use it
const [databases] = await pool.query("SHOW DATABASES");
if (!databases.some(x => x.Database == "discord9000")) {
    await pool.query("CREATE DATABASE discord9000");
}
await pool.query("USE discord9000");

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
] })

client.once("ready", () => console.log("Discord9000 is up and running."))

client.on("messageCreate", async message => {

    // SQL table names mustn't start with digits
    let tableName = "guild" + message.guildId;

    // make sure table for guild exists
    let [tables] = await pool.query("SHOW TABLES");
    if (!tables.some(x => x.Tables_in_discord9000 == tableName)) {
        await pool.query(
            "CREATE TABLE "
                + tableName
                + " (digest CHAR(44) PRIMARY KEY, INDEX USING HASH (digest))"
        );
    }

    // store a crypto hash of the message for privacy and security
    // also simplifies database by using CHAR(44)
    let hash = crypto.createHash("sha256");
    hash.update(message.content);
    let digest = hash.digest("base64"); // always 44 characters long

    // use prepared statement to handle weird strings and avoid injection attack
    // unfortunately table name cannot be placeholder
    let sql = "SELECT * FROM " + tableName + " WHERE digest = ?";
    let values = [digest];
    let [matches] = await pool.execute(sql, values);

    if (matches.length == 0) {
        // no matches, insert into table
        let sql = "INSERT INTO " + tableName + " VALUES (?)"
        let values = [digest];
        await pool.execute(sql, values);
    } else {
        // match found, delete message
        message.delete();
    }

});

client.login(process.env.BOT_TOKEN);
