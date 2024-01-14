<template>
  <div class="container">
    <div class="left-panel">
      <div class="panel-content">
        <!-- 左侧部分 -->
        <h2>模板管理</h2>
        <select v-model="selectedTemplate" @change="fetchTemplateContent">
          <option disabled value="">请选择一个模板</option>
          <option v-for="template in templates" :key="template" :value="template">
            {{ template }}
          </option>
        </select>
        <textarea v-model="templateContent"></textarea>
        <button @click="updateTemplate">更新模板</button>
      </div>
    </div>

    <div class="right-panel">
      <!-- 右侧部分 -->
      <h2>订阅地址上传</h2>
      <select v-model="selectedProxyGroup" @change="fetchProxyGroupNames">
        <option disabled value="">请选择一个代理组</option>
        <option v-for="template in templates" :key="template" :value="template">
          {{ template }}
        </option>
      </select>
      <div class="subscription-items">
        <div v-for="(item, index) in subscriptionItems" :key="index" class="subscription-item">
          <select v-model="item.source_type">
            <option disabled value="">请选择订阅类型</option>
            <option value="file">文件</option>
            <option value="url">URL</option>
          </select>
          <input type="text" v-model="item.text" placeholder="输入订阅链接" />
          <div v-for="group in proxyGroupNames" :key="group" class="proxy-group-checkbox">
            <input type="checkbox" :id="`checkbox-${group}`" :value="group" v-model="item.selectedGroup">
              <label :for="`checkbox-${group}`">{{ group }}</label>
          </div>
        </div>
        <button @click="addSubscriptionItem">添加新行</button>
      </div>
      <button @click="createConfig">上传配置</button>
      <textarea readonly :value="generatedUrl"></textarea>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // 确保已经安装了 axios
const API_BASE_URL = "http://localhost:3000/page";

export default {
  data() {
    return {
      templates: [], // 从接口1加载的模板列表
      selectedTemplate: '', // 当前选中的模板
      templateContent: '', // 接口2加载的模板内容
      subscriptionItems: [], // 订阅项列表
      proxyGroupNames: [], // 接口4加载的代理组名称
      generatedUrl: '', // 接口5返回的URL
      selectedProxyGroup: '' // 当前选中的代理组
    };
  },
  mounted() {
    this.fetchTemplates(); // 加载模板列表
  },
  methods: {
    // 获取模板列表
    async fetchTemplates() {
      try {
          const response = await axios.get(`${API_BASE_URL}/template_list`);
        this.templates = response.data; // 假设接口返回模板名称数组
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    },
    // 获取指定模板的内容
    async fetchTemplateContent() {
      try {
        const response = await axios.post(`${API_BASE_URL}/get_template_content`, { name: this.selectedTemplate });
        this.templateContent = response.data; // 假设接口返回模板内容
      } catch (error) {
        console.error('Failed to fetch template content:', error);
      }
    },
    // 更新模板
    async updateTemplate() {
      try {
        await axios.post(`${API_BASE_URL}/update_template`, { name: this.selectedTemplate, content: this.templateContent });
        alert('模板更新成功');
      } catch (error) {
        console.error('Failed to update template:', error);
        alert('模板更新失败');
      }
    },
    // 获取代理组名称
    async fetchProxyGroupNames() {
      console.log("fetchProxyGroupNames");
      try {
        const response = await axios.post(`${API_BASE_URL}/proxy_group_names`, { name: this.selectedProxyGroup });
        this.proxyGroupNames = response.data.names; // 假设接口返回代理组名称数组
      } catch (error) {
        console.error('Failed to fetch proxy group names:', error);
      }
    },
    // 添加新的订阅项
    addSubscriptionItem() {
      this.subscriptionItems.push({
        source_type: '',
        text: '',
        selectedGroup: []
      });
    },
    // 创建配置并获取URL
    async createConfig() {
      try {
        const validSubscriptions = this.subscriptionItems.filter(item => {
          return item.text.trim() !== '' && item.selectedGroup.length > 0;
        }).map(item => {
          if (item.source_type === 'file') {
            // 如果source_type是file，设置file属性
            return { file: item.text, selectedGroup: item.selectedGroup };
          } else if (item.source_type === 'url') {
            // 如果source_type是url，设置url属性
            return { url: item.text, selectedGroup: item.selectedGroup };
          }
        });
        if (validSubscriptions.length === 0) {
          alert('请至少提供一个有效的订阅项。');
          return;
        }
        const response = await axios.post(`${API_BASE_URL}/create_config`, {
          subscribe_items: validSubscriptions,
          template: this.selectedProxyGroup
        });
        this.generatedUrl = response.data.subscribe_url; // 假设接口返回URL
        // alert('配置上传成功');
      } catch (error) {
        console.error('Failed to create config:', error);
        alert('配置上传失败');
      }
    }
  }
};
</script>

<style scoped>
@import '../assets/ClashPageStyle.css';
</style>
