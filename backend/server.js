const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://bodybuzz-fitness-website.netlify.app'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.error('❌ MongoDB Error:', err.message));

const Enquiry = require('./src/models/Enquiry');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify()
    .then(() => console.log('✅ SMTP connection successful'))
    .catch((error) => console.error('❌ SMTP connection failed:', error.message));

app.get('/api/test', (req, res) => {
    res.json({ message: '✅ BodyBuzz API is working!' });
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactInput(body) {
    const errors = [];
    const { name, phone, message } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
        errors.push('Name is required.');
    } else if (name.trim().length < 2 || name.trim().length > 80) {
        errors.push('Name must be between 2 and 80 characters.');
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
        errors.push('Phone number is required.');
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
        errors.push('Please provide a valid phone number.');
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
        errors.push('Message is required.');
    } else if (message.trim().length < 10 || message.trim().length > 1000) {
        errors.push('Message must be between 10 and 1000 characters.');
    }

    return errors;
}

app.post('/api/contact', async (req, res) => {
    try {
        const errors = validateContactInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const { name, phone, message } = req.body;

        const enquiry = new Enquiry({
            name: name.trim(),
            phone: phone.trim(),
            message: message.trim()
        });
        await enquiry.save();

        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: process.env.CONTACT_RECEIVER,
                subject: `New BodyBuzz Enquiry — ${enquiry.name}`,
                text: `Name: ${enquiry.name}\nPhone: ${enquiry.phone}\n\nMessage:\n${enquiry.message}`
            });
        } catch (mailErr) {
            console.error('⚠️ SMTP send failed:', mailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Your enquiry has been sent successfully. We will contact you soon.',
            data: { id: enquiry._id }
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
        }
        console.error('❌ Contact error:', err.message);
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});