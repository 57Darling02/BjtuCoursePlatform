<template>
    <template v-if="load">
        <div>
            <el-skeleton :rows="6" animated class="skeleton-header" />
        </div>
    </template>
    <template v-else>
        <div style="display: flex; flex-direction: column;">
                <el-input v-model="form.content" type="textarea" placeholder="请输入作业内容" :rows="4"
                    style="margin-bottom: 20px;" />
                <el-upload drag action="/api/back/rp/common/rpUpload.shtml" :on-success="handleUploadSuccess"
                    :on-remove="handleFileRemove" v-model:file-list="uploadFileList" :auto-upload="true"
                    list-type="text" multiple>
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        Drop file here or <em>click to upload</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            files with a size less than 100m
                        </div>
                    </template>
                </el-upload>

                <el-button type="primary" @click="submitHomework" round>提交作业</el-button>

        </div>
    </template>
</template>

<script lang="ts" setup>
import { submitHomeworkAPI } from '@/api/api_ve';
import { el_alert, emitter } from '@/utils';
import type { UploadFile, UploadProps } from 'element-plus';
import { onMounted, ref } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue'

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
const uploadFileList = ref<UploadFile[]>([]);

// 上传成功的回调
const handleUploadSuccess = (response: { STATUS: string; fileNameNoExt: string; fileExtName: string; fileSize: number; visitName: string; }, file: UploadFile) => {
    console.log('fileList', fileList.value)

    if (response.STATUS === "0" && response.fileNameNoExt && response.fileExtName && response.fileSize && response.visitName) {
        el_alert({
            title: '文件上传成功',
            message: `文件 ${decodeURIComponent(response.fileNameNoExt)}.${response.fileExtName} 上传成功!`,
            type: 'success',
        })
        fileList.value.push({
            fileNameNoExt: response.fileNameNoExt,
            fileExtName: response.fileExtName,
            fileSize: response.fileSize,
            visitName: response.visitName,
            pid: "",
            ftype: "insert"
        });
        form.value.fileList = JSON.stringify(fileList.value);
    } else {
        const error = new Error('上传失败')
        handleUploadError(error, file)
    }
};


const handleUploadError = (err: Error, uploadFile: UploadFile) => {
    uploadFile.status = 'fail'
    el_alert({
        title: '文件上传失败',
        message: err.message || '服务器返回异常状态',
        type: 'error'
    })
    uploadFileList.value = uploadFileList.value.filter(item => item !== uploadFile)
}
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
        el_alert({
            title: '作业提交成功',
            message: '作业已成功提交！',
            type: 'success',
        });
        emitter.emit('UPDATE_HOMEWORKS');

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