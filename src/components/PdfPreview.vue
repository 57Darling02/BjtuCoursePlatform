<template>
  <div class="pdf-container">
    <vue-pdf-embed
      :src="pdfUrl"  <!-- PDF文件的URL -->
      :page="currentPage"  <!-- 当前页数 -->
      :scale="scale"  <!-- 设置缩放比例 -->
      @loaded="onPdfLoaded"  <!-- PDF加载完成时触发的事件 -->
    />
    <div class="pdf-controls">
      <button @click="goToPrevPage" :disabled="currentPage <= 1">上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="goToNextPage" :disabled="currentPage >= totalPages">下一页</button>
      <button @click="downloadPdf">下载PDF</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { VuePdfEmbed } from 'vue-pdf-embed';  // 引入vue-pdf-embed组件

export default {
  components: {
    VuePdfEmbed
  },
  setup() {
    const pdfUrl = ref('https://example.com/your-pdf-file.pdf');  // PDF文件的URL
    const currentPage = ref(1);  // 当前页数
    const totalPages = ref(0);  // 总页数
    const scale = ref(1);  // 缩放比例

    // PDF加载完成时获取总页数
    const onPdfLoaded = (pdf) => {
      totalPages.value = pdf.numPages;
    };

    // 翻到上一页
    const goToPrevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    // 翻到下一页
    const goToNextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    // 下载PDF文件
    const downloadPdf = () => {
      const link = document.createElement('a');
      link.href = pdfUrl.value;
      link.download = 'file.pdf';  // 设置下载文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return {
      pdfUrl,
      currentPage,
      totalPages,
      scale,
      onPdfLoaded,
      goToPrevPage,
      goToNextPage,
      downloadPdf
    };
  }
};
</script>

<style scoped>
.pdf-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.pdf-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

button {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
}

button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}
</style>