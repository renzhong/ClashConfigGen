<template>
  <div class="container">
    <h1>Clash Configuration Generator</h1>
    <div class="input-group">
      <label for="url-input">请输入订阅链接：</label>
      <input id="url-input" v-model="url" type="text" :class="{'error': !isValidUrl}" placeholder="Enter URL of the clash config" @input="validateUrl"/>
      <span v-if="!isValidUrl" class="error-message">请输入有效的URL。</span>
    </div>
    <div class="input-group">
      <label for="rules-input">请输入自定义规则：</label>
      <textarea id="rules-input" v-model="configText" @input="validateConfigText" placeholder="Enter your clash rules text here..."></textarea>
      <span v-if="configTextError" class="error-message">规则文本不能为空。</span>
    </div>
    <button @click="uploadData">Upload</button>
    <p v-if="uploadStatus">{{ uploadStatus }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      url: '',
      configText: '',
      uploadStatus: '', // 用于显示上传状态的属性
      isValidUrl: true, // 新增数据项
      configTextError: false // 新增状态，指示规则文本错误
    }
  },
  mounted() {
    this.fetchConfig();
  },
  methods: {
    validateUrl() {
      // 简单的URL验证规则
      this.isValidUrl = this.url.startsWith('http://') || this.url.startsWith('https://');
    },
    triggerShake(selector) {
      const element = this.$el.querySelector(selector);
      element.classList.add('shake');

      // Remove the class after animation completes
      setTimeout(() => {
        element.classList.remove('shake');
      }, 820); // match the duration of the shake animation
    },
    validateConfigText() {
      if (this.configText.trim()) {
        this.configTextError = false;
      }
    },
    setTemporaryMessage(message, duration = 1000) {
      this.uploadStatus = message;
      setTimeout(() => {
        this.uploadStatus = '';
      }, duration);
    },
    async uploadData() {
      // 简单的格式检查
      if (!this.isValidUrl) {
        this.triggerShake('#url-input');
        return;
      }
      if (!this.configText.trim()) {
        this.configTextError = true; // 设置错误状态
        this.triggerShake('#rules-input');
        return;
      }

      const apiEndpoint = 'http://localhost:3000/api/upload'; // 后端API端点
      // 创建要发送的数据对象
      const dataToSend = {
        url: this.url,
        configText: this.configText
      };

      // 使用 fetch 发送数据
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // const data = await response.json();

        this.setTemporaryMessage("上传成功")
      } catch (error) {
        this.setTemporaryMessage("上传失败")
      }
      // console.log("URL: ", this.url);
      // console.log("Config Text: ", this.configText);
    },
    async fetchConfig() {
      const apiEndpoint = 'http://localhost:3000/api/config';

      try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 更新组件的data属性
        this.url = data.url || '';
        this.configText = data.configText || '';
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    }
  }
}
</script>

<style scoped>
.container {
  width: 80%;
  max-width: 600px;
  margin: 0 auto;
  padding-top: 2rem;
  text-align: center;
}

.input-group {
  margin-bottom: 1rem;
}

.error {
  border-color: red; /* 输入框变红 */
}

.error-message {
  color: red; /* 错误信息文字颜色 */
  font-size: 0.8rem; /* 调整字体大小 */
}

input[type="text"] {
  width: 100%;
  padding: 0.5rem;
}

textarea {
  width: 100%;
  height: 50vh; /* 50% of the viewport height */
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1rem;
  margin-top: 1rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

.shake {
  animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>
