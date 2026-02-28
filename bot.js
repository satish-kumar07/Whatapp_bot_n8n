const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

const app = express();
app.use(express.json());


// WHATSAPP CLIENT

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('Scan the QR code below:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

client.on('message', async (message) => {
    if (message.fromMe) return;

    console.log('Message received:', message.body);

    try {
        const response = await axios.post(
            'http://localhost:5678/webhook/whatsapp',
            {
                body: message.body,
                from: message.from,
            }
        );

        if (response.data?.reply) {
            await message.reply(response.data.reply);
            console.log('Reply sent:', response.data.reply);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
});


//  EXPRESS TEST ROUTE


app.post('/simulate-self', async (req, res) => {
    const { body, from } = req.body;

    if (!body || !from) {
        return res.status(400).json({ error: 'Provide body and from' });
    }

    try {
        const chat = await client.getChatById(from);
        await chat.sendMessage(body);
        res.json({ status: 'Message sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');

    const number = '91XXXXXXXX@c.us'; // replace with your friend's number
    const message = 'Hello {Your Name}, this is a test message from the WhatsApp bot!';

    try {
        await client.sendMessage(number, message);
        console.log('Message sent successfully!');
    } catch (err) {
        console.error('Error sending message:', err);
    }
});


//  START EVERYTHING


app.listen(3000, () => {
    console.log('Express running on port 3000');
});

client.initialize();