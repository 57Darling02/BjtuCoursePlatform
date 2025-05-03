<template>
    <template v-if="load">
        <div >
            <el-skeleton :rows="6" animated class="skeleton-header" />
        </div>
    </template>
    <template v-else>
        <div>
            <div style="margin-top: 20px;">
                <el-input v-model="form.content" type="textarea" placeholder="请输入作业内容" :rows="4"
                    style="margin-bottom: 20px;" />
                <el-upload action="/api/back/rp/common/rpUpload.shtml" :on-success="handleUploadSuccess"
                    :on-remove="handleFileRemove" :file-list="fileList" :auto-upload="true" :data="uploadData"
                    list-type="text">
                    <el-button type="primary">上传文件</el-button>
                </el-upload>
                <el-button type="primary" @click="submitHomework">确定</el-button>
            </div>
        </div>
    </template>
</template>

<script lang="ts" setup>
import { submitHomeworkAPI } from '@/api/api_ve';
import { el_alert } from '@/utils';
import { onMounted, ref } from 'vue';

const props = defineProps({
    hwid: {
        type: Number,
        required: true,
        default: '0'
    },
    courseId: {
        type: String,
        default: "0"
    },

});

const load = ref(false);

// 响应式表单变量
const form = ref({
    content: "",
    groupName: "",
    groupId: "",
    courseId: props.courseId,
    contentType: "0",
    fz: "0",
    jxrl_id: "",
    fileList: "" as string,
    upId: `${props.hwid}`,
    return_num: "0",
    isTeacher: "0"
});

// 上传文件的响应结果
const fileList = ref<Array<{
    fileNameNoExt: string;
    fileExtName: string;
    fileSize: number;
    visitName: string;
    pid: string;
    ftype: string;
}>>([]);

// 上传附加数据
const uploadData = {
    // 可根据需要添加额外的参数
};

// 上传成功的回调
const handleUploadSuccess = (response: { STATUS: string; fileNameNoExt: string; fileExtName: string; fileSize: number; visitName: string; }, file: File) => {
    if (response.STATUS === "0") {
        fileList.value.push({
            fileNameNoExt: response.fileNameNoExt,
            fileExtName: response.fileExtName,
            fileSize: response.fileSize,
            visitName: response.visitName,
            pid: "",
            ftype: "insert"
        });
        form.value.fileList = JSON.stringify(fileList.value);
    }
};

// 删除文件的回调
const handleFileRemove = (file: { name: string }) => {
    const index = fileList.value.findIndex(item => item.fileNameNoExt === file.name);
    if (index !== -1) {
        fileList.value.splice(index, 1);
        form.value.fileList = JSON.stringify(fileList.value.map(item => ({
            ...item,
            ftype: "delete"
        })));
    }
};

const submitHomework = async () => {
    try {
        if (!form.value.fileList) {
            form.value.fileList = "[]";
        }
        const response = await submitHomeworkAPI(form.value);
        // console.log('作业提交成功:', response);
        el_alert({
            title: '作业提交成功',
            message: '作业已成功提交！',
            type: 'success',
        });
        // await userStore.fetchdata();
        window.location.reload()
    } catch (error) {
        console.error('作业提交失败:', error);
        el_alert({
            title: '作业提交失败',
            message: '提交作业时发生错误，请重试。',
            type: 'error',
        });
    }
};

</script>

<style scoped></style>