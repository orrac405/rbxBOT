const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

app.use(bodyParser.json());

// MongoDB connection URI
const uri = 'mongodb+srv://uptrical:baba@guildcode.nnxcj.mongodb.net/';

// Create a new MongoClient
const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db, collection;

// Connect to MongoDB
mongoClient.connect(async err => {
    if (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
    db = mongoClient.db('YOUR_DATABASE_NAME'); // Replace with your database name
    collection = db.collection('playerData'); // Replace with your collection name

    // Ensure collection is created
    const collections = await db.listCollections({ name: 'playerData' }).toArray();
    if (collections.length === 0) {
        await db.createCollection('playerData');
    }

    console.log('Connected to MongoDB');
});

// Express.js Server: Handling HTTP Request and Saving Data
app.post('/save', async (req, res) => {
    const newData = req.body;

    try {
        // Upsert data (insert or update)
        const bulkOps = newData.map(entry => ({
            updateOne: {
                filter: { userId: entry.userId },
                update: { $set: entry },
                upsert: true
            }
        }));

        await collection.bulkWrite(bulkOps);
        res.status(200).send('Data saved');
    } catch (err) {
        console.error('Failed to save data', err);
        res.status(500).send('Failed to save data');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Discord Bot: Reading Data and Displaying with Command
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
client.on(Events.MessageCreate, async message => {
    if (message.content === '!dakika-info') {
        try {
            const data = await collection.find({}).toArray();
            const dataString = data.map(entry => JSON.stringify(entry)).join('\n');

            const filePath = path.join(__dirname, 'playerData.txt');
            fs.writeFile(filePath, dataString, (err) => {
                if (err) {
                    console.error('Failed to write file', err);
                    message.channel.send('Veri dosyası yazılamadı.');
                } else {
                    message.channel.send({
                        files: [{
                            attachment: filePath,
                            name: 'playerData.txt'
                        }]
                    });
                }
            });
        } catch (err) {
            console.error('Failed to fetch data', err);
            message.channel.send('Veri alınamadı.');
        }
    }
});

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login(process.env.token);
