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
                :on-remove="handleFileRemove" v-model:file-list="uploadFileList" :auto-upload="true" list-type="text"
                multiple>
                <i class="fa-solid fa-cloud-arrow-up upload-icon" aria-hidden="true" />
                <div class="el-upload__text">
                    Drop file here or <em>click to upload</em>
                </div>
                <template #tip>
                    <div class="el-upload__tip">
                        files with a size less than 100m
                    </div>
                </template>
            </el-upload>

            <el-space wrap>
                <el-button type="primary" @click="submitHomework" round>提交作业</el-button>
                <el-button v-if="showHelperSubmitButton" type="warning" plain @click="helperDialogVisible = true" round>帮忙提交</el-button>
            </el-space>
        </div>
    </template>

    <el-dialog v-model="helperDialogVisible" title="帮忙提交" width="420px" append-to-body>
        <el-form v-if="!USE_DEV_FIXED_HELPER_CREDENTIALS" label-width="72px">
            <el-form-item label="账号">
                <el-input v-model="helperAccount.username" placeholder="请输入账号" clearable />
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="helperAccount.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
        </el-form>
        <el-alert
            v-else
            :title="DEV_HELPER_DIALOG_MESSAGE"
            type="info"
            :closable="false"
            show-icon
        />
        <template #footer>
            <el-button @click="helperDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="helperSubmitting" @click="submitHomeworkByHelper" round>
                确认帮忙提交
            </el-button>
        </template>
    </el-dialog>
</template>

<script lang="ts" setup>
import { submitHomeworkAPI } from '@/api/api_ve';
import {
    DEV_HELPER_DIALOG_MESSAGE,
    DEV_HELPER_PASSWORD,
    DEV_HELPER_USERNAME,
    USE_DEV_FIXED_HELPER_CREDENTIALS,
    developerModeEnabled,
    el_alert,
    emitter,
} from '@/utils';
import type { UploadFile } from 'element-plus';
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
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
    force_push:{
        type: Boolean,
        default: false
    },
    return_num: {
        type: Number,
        default: 0
    },
    fz: {
        type: Number,
        default: 0
    }

});

const load = ref(false);
const helperDialogVisible = ref(false)
const helperSubmitting = ref(false)
const helperAccount = ref({
    username: '',
    password: '',
})
const showHelperSubmitButton = computed(() => developerModeEnabled.value)
const submitContext = computed(() => ({
    isTeacher: props.force_push ? '1' : '0',
    stuId: props.force_push ? '118955' : userStore.userinfo?.qxkt_id,
}))

// 响应式表单变量
const form = ref({
    content: "",
    groupName: "",
    groupId: "",
    courseId: props.courseId,
    contentType: "0",
    fz: `${props.fz}`,
    jxrl_id: "",
    fileList: "" as string,
    upId: `${props.hwid}`,
    return_num: `${props.return_num}`,
    isTeacher: submitContext.value.isTeacher,
    stuId: userStore.userinfo?.qxkt_id
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

const sendSubmitRequest = async () => {
    if (!form.value.fileList) {
        form.value.fileList = "[]";
    }
    form.value.isTeacher = submitContext.value.isTeacher;
    form.value.stuId = submitContext.value.stuId
    await submitHomeworkAPI(form.value);
}

const submitHomework = async () => {
    try {
        await sendSubmitRequest()
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

const submitHomeworkByHelper = async () => {
    if (!developerModeEnabled.value) {
        el_alert({
            title: '功能未开启',
            message: '请先开启开发者模式',
            type: 'warning',
        })
        return
    }
    const helperUsername = USE_DEV_FIXED_HELPER_CREDENTIALS
        ? DEV_HELPER_USERNAME
        : helperAccount.value.username.trim()
    const helperPassword = USE_DEV_FIXED_HELPER_CREDENTIALS
        ? DEV_HELPER_PASSWORD
        : helperAccount.value.password
    if (!helperUsername || !helperPassword) {
        el_alert({
            title: '参数不完整',
            message: '请输入帮忙提交的账号和密码',
            type: 'warning',
        })
        return
    }

    helperSubmitting.value = true
    try {
        const { restored } = await userStore.runWithTemporaryAccount(
            {
                username: helperUsername,
                password: helperPassword,
            },
            sendSubmitRequest
        )
        el_alert({
            title: '帮忙提交成功',
            message: '已使用帮忙账号完成提交',
            type: 'success',
        })
        emitter.emit('UPDATE_HOMEWORKS')
        if (!restored) {
            el_alert({
                title: '账号恢复提示',
                message: '原账号恢复重连失败，请手动重连一次',
                type: 'warning',
            })
        }
        helperDialogVisible.value = false
    } catch (error) {
        console.error('帮忙提交失败:', error)
        el_alert({
            title: '帮忙提交失败',
            message: '换号后提交失败，请稍后重试',
            type: 'error',
        })
    } finally {
        if (!USE_DEV_FIXED_HELPER_CREDENTIALS) {
            helperAccount.value.password = ''
        }
        helperSubmitting.value = false
    }
}

</script>

<style scoped>
.upload-icon {
    color: var(--el-text-color-placeholder);
    font-size: 67px;
    line-height: 50px;
    margin-bottom: 16px;
}
</style>
