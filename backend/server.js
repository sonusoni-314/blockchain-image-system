const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const PinataClient = require('@pinata/sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Accept images AND videos
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      // images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // videos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type: ' + file.mimetype));
    }
  }
});

// Pinata client
const pinata = new PinataClient(process.env.PINATA_KEY, process.env.PINATA_SECRET);

// Blockchain connection
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI = require('./abi.json');
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Generate SHA-256 hash from file buffer
function generateHash(fileBuffer) {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// Detect media type from mimetype
function getMediaType(mimetype) {
  if (mimetype && mimetype.startsWith('video/')) return 'video';
  return 'image';
}

// ROUTE: Upload image OR video to Pinata + register on blockchain
app.post('/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileBuffer = fs.readFileSync(req.file.path);
    const sha256Hash = generateHash(fileBuffer);
    const mediaType = getMediaType(req.file.mimetype);

    // Upload to Pinata/IPFS
    const readableStream = fs.createReadStream(req.file.path);
    const pinataResult = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: {
        name: req.file.originalname,
        keyvalues: { mediaType }
      }
    });
    const ipfsCID = pinataResult.IpfsHash;

    // Delete temp file
    fs.unlinkSync(req.file.path);

    // Register on blockchain — store mediaType inside filename field
    const { viewLimit, daysValid } = req.body;
    const tx = await contract.uploadImage(
      ipfsCID,
      sha256Hash,
      parseInt(viewLimit),
      parseInt(daysValid)
    );
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'ImageUploaded');
    const imageId = event.args.imageId.toString();

    res.json({ success: true, imageId, sha256Hash, ipfsCID, mediaType });

  } catch (err) {
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// ROUTE: Serve media (image or video) from IPFS via Pinata gateway
app.get('/media/:cid', async (req, res) => {
  try {
    const gatewayUrl = `${process.env.PINATA_GATEWAY}/ipfs/${req.params.cid}`;
    console.log('Fetching from:', gatewayUrl);

    const protocol = gatewayUrl.startsWith('https') ? https : http;

    protocol.get(gatewayUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(404).json({ error: 'Media not found on IPFS' });
      }
      // Forward the content-type from Pinata so browser knows if it's video or image
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      response.pipe(res);
    }).on('error', (err) => {
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep old /image/:cid route as alias so nothing breaks
app.get('/image/:cid', async (req, res) => {
  try {
    const gatewayUrl = `${process.env.PINATA_GATEWAY}/ipfs/${req.params.cid}`;
    const protocol = gatewayUrl.startsWith('https') ? https : http;
    protocol.get(gatewayUrl, (response) => {
      if (response.statusCode !== 200) return res.status(404).json({ error: 'Not found' });
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      response.pipe(res);
    }).on('error', err => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROUTE: Get metadata from blockchain
app.get('/metadata/:id', async (req, res) => {
  try {
    const data = await contract.getImage(parseInt(req.params.id));
    res.json({
      owner:     data[0],
      ipfsCID:   data[1],
      sha256Hash: data[2],
      viewLimit: data[3].toString(),
      viewCount: data[4].toString(),
      expiry:    new Date(data[5].toNumber() * 1000).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));