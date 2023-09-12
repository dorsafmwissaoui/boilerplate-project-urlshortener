const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// Basic Configuration
const port = process.env.PORT || 3000;

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number, // Use a number for short_url
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl', async function(req, res) {
  const originalUrl = req.body.url;

  // Check if the provided URL follows the valid format
  const urlRegex = /^(https?:\/\/)?([\w.-]+\.\w{2,})(\/\S*)?$/;
  if (!urlRegex.test(originalUrl)) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }

  try {
    // Generate the short URL
    const urlCount = await Url.countDocuments();
    const shortUrl = urlCount + 1; // Use the count of existing documents as the short URL

    const url = new Url({
      original_url: originalUrl,
      short_url: shortUrl,
    });

    await url.save();

    res.json({ original_url: originalUrl, short_url: shortUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred.' });
  }
});



app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = req.params.short_url;

  try {
    // Find the URL in the database based on the short URL (which is the short_url field)
    const url = await Url.findOne({ short_url: shortUrl });

    if (!url) {
      res.status(404).json({ error: 'Short URL not found' });
      return;
    }

    // Redirect to the original URL
    res.redirect(url.original_url);
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ error: 'An error occurred.' });
  }
});

app.get('/api/whoami', function(req, res) {
  const ipaddress = req.ip;
  const language = req.headers['accept-language'];
  const software = req.headers['user-agent'];

  const userInfo = {
    ipaddress: ipaddress,
    language: language,
    software: software,
  };

  res.json(userInfo);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
