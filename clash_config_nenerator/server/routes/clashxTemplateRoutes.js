const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const router = express.Router();

// 路径到数据和模板文件夹
const DATA_DIR = path.join(__dirname, '../data');
const TEMPLATE_DIR = path.join(__dirname, '../template');

router.get('/:id', async (req, res) => {
    const requestedId = req.params.id;

    try {
        const filePath = path.join(DATA_DIR, 'config.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const configData = JSON.parse(fileContent);
        if (configData.id !== requestedId) {
            res.status(404).send('Config not found');
            return;
        }

        // 读取并解析模板文件
        const templateYaml = yaml.load(fs.readFileSync(path.join(TEMPLATE_DIR, configData.template), 'utf8'));
        // 用于存储合并后的代理列表
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
                    sourceConfigYaml = yaml.load(fs.readFileSync(path.join(DATA_DIR, source.file), 'utf8'));
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
                console.info(`groupName 1 ${groupName}`);
                if (group) {
                    console.info(`groupName 2 ${group.proxies}`);
                    if (!Array.isArray(group.proxies)) {
                        group.proxies = [];
                    }
                    console.info(`groupName 3 ${group.proxies}`);
                    sourceConfigYaml.proxies.forEach(proxy => {
                        if (!group.proxies.includes(proxy.name)) {
                            group.proxies.push(proxy.name);
                        }
                    });
                    console.info(`groupName 4 ${group.proxies}`);
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
