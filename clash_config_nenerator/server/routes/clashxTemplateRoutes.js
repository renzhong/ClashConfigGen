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

        for (const item of configData) {
            let sourceConfigYaml;
            if (item.url) {
                // 通过HTTP请求获取远程配置
                try {
                    const response = await axios.get(item.url);
                    sourceConfigYaml = yaml.load(response.data);
                } catch (error) {
                    console.error(`Error fetching remote config from URL: ${item.url}`, error);
                    continue; // 跳过这个源，继续下一个
                }
            } else if (item.file) {
                // 从本地文件加载配置
                try {
                    sourceConfigYaml = yaml.load(fs.readFileSync(path.join(LOCAL_CLASH_DIR, item.file), 'utf8'));
                } catch (error) {
                    console.error(`Error reading file: ${item.file}`, error);
                    continue; // 跳过这个源，继续下一个
                }
            }

            // 合并proxies
            if (sourceConfigYaml && sourceConfigYaml.proxies) {
                allProxies = [...allProxies, ...sourceConfigYaml.proxies];
            }

            // 更新proxy-groups
            item.selectedGroup.forEach(groupName => {
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

        // 查找名为“🪴GPT自动选择”的proxy-group
        const gptAutoSelectGroup = templateYaml['proxy-groups'].find(group => group.name === "🪴GPT自动选择");

        if (gptAutoSelectGroup && Array.isArray(gptAutoSelectGroup.proxies)) {
            // 找出所有不包含"香港"的代理服务器名称
            const validProxies = templateYaml.proxies
                .filter(proxy => !proxy.server.includes("hk"))
                .map(proxy => proxy.name);

            // 过滤出“🪴GPT自动选择”组中的有效代理
            gptAutoSelectGroup.proxies = gptAutoSelectGroup.proxies.filter(proxyName => validProxies.includes(proxyName));
        }

        // 将最终结果转换为YAML格式并发送
        res.type('text/plain');
        res.send(yaml.dump(templateYaml));
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
