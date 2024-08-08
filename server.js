const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const directoryPath = path.join(__dirname, 'form-json');
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// Endpoint to list JSON files in the directory
app.get('/list-files', (req, res) => {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory');
        }
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        res.json(jsonFiles);
    });
});

// Endpoint to serve a specific JSON file
app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(directoryPath, filename);
    res.sendFile(filepath);
});

app.listen(port, () => {
    console.log('Server is running on port ${port}');
});