const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const mysql = require('mysql2/promise');
const config = require('config');
const router = express.Router();

// 路径到数据和模板文件夹
const LOCAL_CLASH_DIR = config.get('local_clash_dir');
const TEMPLATE_DIR = config.get('template_dir');
const dbConfig = config.get('db');

router.get('/:id', async (req, res) => {
    const requestedId = req.params.id;

    try {
        // 建立数据库连接
        const connection = await mysql.createConnection(dbConfig);

        // 从数据库中检索配置
        const [rows, fields] = await connection.execute('SELECT * FROM clash_configs WHERE uuid = ?', [requestedId]);

        if (rows.length === 0) {
            res.status(404).send('Config not found');
            return;
        }

        // 从数据库中获取config和template信息
        const configData = rows[0].config_json; // Assuming column name is 'config_json'
        const templatePath = rows[0].template_path; // Assuming column name is 'template_path'

        // 读取并解析模板文件
        const templateYaml = yaml.load(fs.readFileSync(path.join(TEMPLATE_DIR, templatePath), 'utf8'));

        let allProxies = templateYaml.proxies || [];

        templateYaml['proxy-groups'].forEach(group => {
            console.info(`template ${group.name}`);
        });

        for (const [name, source] of Object.entries(configData.urls)) {
            let sourceConfigYaml;
            if (source.url) {
                // 通过HTTP请求获取远程配置
                try {
                    const headersConfig = {
                        'User-Agent': 'curl/7.81.0',
                        'Accept': '*/*'
                    };
                    const response = await axios.get(source.url);
                    sourceConfigYaml = yaml.load(response.data);
                } catch (error) {
                    console.error(`Error fetching remote config for ${name}:`, error);
                    continue; // 跳过这个源，继续下一个
                }
            } else if (source.file) {
                // 从本地文件加载配置
                try {
                    sourceConfigYaml = yaml.load(fs.readFileSync(path.join(LOCAL_CLASH_DIR, source.file), 'utf8'));
                } catch (error) {
                    console.error(`Error reading file for ${name}:`, error);
                    continue; // 跳过这个源，继续下一个
                }
            }

            // 合并proxies
            if (sourceConfigYaml && sourceConfigYaml.proxies) {
                allProxies = [...allProxies, ...sourceConfigYaml.proxies];
            }

            // 更新proxy-groups
            source.group.forEach(groupName => {
                const group = templateYaml['proxy-groups'].find(g => g.name === groupName);
                if (group) {
                    if (!Array.isArray(group.proxies)) {
                        group.proxies = [];
                    }
                    sourceConfigYaml.proxies.forEach(proxy => {
                        if (!group.proxies.includes(proxy.name)) {
                            group.proxies.push(proxy.name);
                        }
                    });
                }
            });
        }

        // 更新templateYaml的proxies部分
        templateYaml.proxies = allProxies;

        // 将最终结果转换为YAML格式并发送
        res.type('text/plain');
        res.send(yaml.dump(templateYaml));
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
