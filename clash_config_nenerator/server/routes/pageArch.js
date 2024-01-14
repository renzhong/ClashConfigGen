// server/routes/pageArch.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const config = require('config');
const yaml = require('js-yaml');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const TEMPLATE_DIR = config.get('template_dir');
const dbConfig = config.get('db');
const baseSubscribeUrl = config.get('base_subscribe_url')

// 接口1：获取模板目录中的文件列表
router.get('/template_list', (req, res) => {
  console.log("Template Directory: ", TEMPLATE_DIR);
  fs.readdir(TEMPLATE_DIR, (err, files) => {
    if(err) {
      return res.status(500).send('Unable to read template directory');
    }
    const jsonFiles = files
      .map(file => path.basename(file, '.yaml'));
    res.json(jsonFiles)
    console.log("Template files: ", jsonFiles);
  });
});

// 接口2：根据提供的名称返回对应的YAML文件内容
router.post('/get_template_content', (req, res) => {
  const { name } = req.body; // 从请求体中获取name字段

  if (!name) {
    return res.status(400).send('Name is required');
  }

  const filePath = path.join(TEMPLATE_DIR, `${name}.yaml`); // 构造文件完整路径

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // 如果文件不存在或其他错误，返回错误信息
      if (err.code === 'ENOENT') {
        return res.status(404).send('Template not found');
      } else {
        return res.status(500).send('Error reading template file');
      }
    }

    // 设置响应类型为text/yaml或者text/plain
    res.type('text/yaml');

    // 返回文件内容
    res.send(data);
  });
});

// 接口3：根据提供的名称创建或更新YAML文件
router.post('/update_template', (req, res) => {
  const { name, content } = req.body; // 从请求体中获取name和content字段

  if (!name || !content) {
    return res.status(400).send('Both name and content are required');
  }

  const filePath = path.join(TEMPLATE_DIR, `${name}.yaml`); // 构造文件完整路径

  // 将content写入文件
  fs.writeFile(filePath, content, 'utf8', (err) => {
    if (err) {
      return res.status(500).send('Error writing to template file');
    }

    // 返回成功消息
    res.send(`Template ${name} updated successfully`);
  });
});

// 接口4：根据提供的名称返回对应YAML文件中proxy-group的name列表
router.post('/proxy_group_names', (req, res) => {
  console.log("call proxy_group_names");
  const { name } = req.body; // 从请求体中获取name字段

  if (!name) {
    return res.status(400).send('Name is required');
  }

  const filePath = path.join(TEMPLATE_DIR, `${name}.yaml`); // 构造文件完整路径

  // 读取并解析YAML文件
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('Template not found');
      } else {
        return res.status(500).send('Error reading template file');
      }
    }

    try {
      const doc = yaml.load(data); // 解析YAML文件内容
      const proxyGroups = doc['proxy-groups']; // 获取proxy-groups部分

      const names = proxyGroups.map(group => group.name); // 提取每个组的name字段
      res.json({ names }); // 返回names数组
    } catch (e) {
      res.status(500).send('Failed to parse the YAML file');
    }
  });
});

// 接口5: 处理创建配置请求
router.post('/create_config', async (req, res) => {
  try {
    const { subscribe_items, template } = req.body;
    const uuid = uuidv4(); // 生成UUID
    const configJson = JSON.stringify(subscribe_items); // 序列化subscribe_items
    const templatePath = template; // 从请求中获取模板路径

    const connection = await mysql.createConnection(dbConfig);

    // 构建插入到数据库的数据
    const postData = {
      uid: null, // uid为空
      uuid: uuid,
      config_json: configJson,
      template_path: `${templatePath}.yaml`,
      created_at: new Date(), // 使用当前时间作为创建时间
      updated_at: new Date()  // 使用当前时间作为更新时间
    };

    // 将数据插入数据库
    await connection.execute(
      'INSERT INTO clash_configs (uid, uuid, config_json, template_path) VALUES (?, ?, ?, ?)',
      [postData.uid, postData.uuid, postData.config_json, postData.template_path]
    );

    // 构建SQL语句（此处仅为示例，根据实际表结构调整）
    const sql = `INSERT INTO clash_configs (uid, uuid, config_json, template_path) VALUES (NULL, '${uuid}', '${configJson}', '${templatePath}')`;

    // 打印SQL语句，而不是执行它
    console.log("SQL Statement for Testing:", sql);

    // 构建subscribe_url
    const subscribeUrl = `${baseSubscribeUrl}${uuid}`; // 使用插入的ID拼接URL

    // 返回JSON响应
    res.json({
      subscribe_url: subscribeUrl
    });
  } catch (error) {
    console.error('Database operation failed:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
