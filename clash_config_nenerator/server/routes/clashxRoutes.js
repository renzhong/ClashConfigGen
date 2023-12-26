const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const router = express.Router();

router.get('/:id', async (req, res) => {
  const requestedId = req.params.id;
  const filePath = path.join(__dirname, '../data', 'config.json');

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const configData = JSON.parse(fileContent);
    if (configData.id !== requestedId) {
      res.status(404).send('Config not found');
      return;
    }

    let clashConfig;
    let clashResponse;
    try {
      // 尝试发送请求获取原始Clash订阅配置
      clashResponse = await axios.get(configData.url);
    } catch (networkError) {
      console.error('Network error when fetching clash config:', networkError);
      res.status(500).send('Failed to fetch clash config');
      return; // 早期返回，避免进一步处理
    }
    clashConfig = yaml.load(clashResponse.data);

    // 修改rules
    const customRules = configData.configText.split('\n'); // 假设configText是按行分隔的规则
    clashConfig.rules = [...customRules, ...clashConfig.rules];

    // 转换回文本
    const newYamlText = yaml.dump(clashConfig);

    // 设置 MIME 类型为纯文本
    res.type('text/plain');
    res.send(newYamlText);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
