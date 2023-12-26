// server/routes/configRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // 引入uuid库
const router = express.Router();

// GET /api/config
router.get('/config', (req, res) => {
  const filePath = path.join(__dirname, '../data', 'config.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error reading from file' });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error(parseErr);
      res.status(500).json({ message: 'Error parsing the data' });
    }
  });
});

// POST /api/upload
router.post('/upload', (req, res) => {
  const { url, configText } = req.body;

  // 生成一个新的UUID
  const id = uuidv4()

  // 你可以根据需要更改文件名和路径
  const filePath = path.join(__dirname, '../data', 'config.json');

  const dataToWrite = {
    id,
    url,
    configText
  };

  // 将对象写入文件，JSON.stringify转换为字符串
  fs.writeFile(filePath, JSON.stringify(dataToWrite), 'utf8', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error writing to file' });
    }

    res.json({ message: 'Data written to file successfully', id: id  });
  });
});

module.exports = router;
