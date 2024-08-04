const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Events } = require('discord.js');

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

app.use(bodyParser.json());

// Path to data file
const filePath = path.join(__dirname, 'playerData.json');

// Express.js Server: Handling HTTP Request and Saving Data
app.post('/save', (req, res) => {
    const newData = req.body;

    // Read existing data
    fs.readFile(filePath, 'utf8', (err, data) => {
        let existingData = [];
        if (!err && data) {
            try {
                existingData = JSON.parse(`[${data.trim().replace(/\n/g, ',')}]`); // Convert log to array
            } catch (parseErr) {
                console.error('Failed to parse existing data', parseErr);
                existingData = [];
            }
        }

        // Create a map for quick lookup
        const dataMap = new Map();
        existingData.forEach(entry => dataMap.set(entry.userId, entry));

        // Update or add new data
        newData.forEach(entry => dataMap.set(entry.userId, entry));

        // Convert map back to array
        const updatedData = Array.from(dataMap.values());

        // Write updated data to file
        fs.writeFile(filePath, updatedData.map(entry => JSON.stringify(entry)).join('\n'), (writeErr) => {
            if (writeErr) {
                console.error('Failed to save data', writeErr);
                res.status(500).send('Failed to save data');
            } else {
                res.status(200).send('Data saved');
            }
        });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Discord Bot: Reading Data and Displaying with Command
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
client.on(Events.MessageCreate, message => {
    if (message.content === '!dakika-info') {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Failed to access file', err);
                message.channel.send('Veri dosyası bulunamadı.');
            } else {
                message.channel.send({
                    files: [{
                        attachment: filePath,
                        name: 'playerData.txt'
                    }]
                });
            }
        });
    }
});
// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login(process.env.token);
