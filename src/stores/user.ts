import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { emitter, el_alert, decryptData, encryptData } from '@/utils';
import {
    type TermInfo,
    type CourseInfo,
    type HomeworkItem,
    type UserInfo,
} from '@/api';

import { login_ve, logout, getUserInfo as getUserInfo_ve, getAllTerm, getAllCourses } from '@/api/api_ve';
import { getUserInfo as getUserInfo_app } from '@/api/api_app';
import router from '@/router';
import { throttle } from 'lodash-es';
const USER_STORAGE_KEY = 'user_store'

export const useUserStore = defineStore('user', () => {
    // 从 localStorage 恢复状态，如果没有则使用默认值
    const storedState = localStorage.getItem(USER_STORAGE_KEY);
    const initialState: any = storedState
        ? decryptData<typeof initialState>(storedState) ?? {
            isAuthenticated: false,
            username: '',
            password: '',
            userinfo: null,
            activeSemester: null,
            courseList: [],
            homeworkList: [],
        }
        : {
            isAuthenticated: false,
            username: '',
            password: '',
            userinfo: null,
            activeSemester: null,
            courseList: [],
            homeworkList: [],
        }

    const isAuthenticated = ref<boolean>(initialState.isAuthenticated);
    const username = ref<string>(initialState.username);
    const password = ref<string>(initialState.password);
    const isLoading = ref(false)
    const taskQueue = ref<Array<() => Promise<void>>>([]);
    const isProcessingQueue = ref(false);
    const status_ve = ref<boolean>(false)
    const status_app = ref<boolean | null>(null)
    const retryConnect = ref<number>(0)

    // 缓存部分数据
    const Cache = ref<Record<string, any>>({});
    const useCache = (name: string, something: any) => {
        Cache.value[name] = something;
    };

    const userinfo = ref<UserInfo>(initialState.userinfo)
    const activeSemester = ref<TermInfo | null>(initialState.activeSemester)
    const courseList = ref<CourseInfo[]>(initialState.courseList)
    const homeworkList = ref<HomeworkItem[]>(initialState.homeworkList)


    const addTaskToQueue = (task: () => Promise<void>) => {
        taskQueue.value.push(task);
        if (!isProcessingQueue.value) {
            processTaskQueue();
        }
    };

    const processTaskQueue = async () => {
        isProcessingQueue.value = true;
        while (taskQueue.value.length > 0) {
            const currentTask = taskQueue.value.shift();
            if (currentTask) {
                try {
                    console.log('Executing task:', currentTask.name);
                    await currentTask();
                } catch (error) {
                    console.error('Task execution failed:', error);
                }
            }
        }
        isProcessingQueue.value = false;
    };

    const handlelogout = async () => {
        try {
            await logout()
            isAuthenticated.value = false
            router.push('/login')
            
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const go_kcpt = async () => {
        await logout();
        setTimeout(() => {
            window.location.href = `http://123.121.147.7:88/ve/s.shtml?username=${username.value}&loginType=2&login=main_2`;
        }, 500);
    }

    const checkAuth_ve = async () => {
        while (retryConnect.value < 3) {
            try {
                const veUserInfo = await getUserInfo_ve()
                userinfo.value = { ...userinfo.value, ...veUserInfo };
                status_ve.value = true;
            } catch {
                status_ve.value = false;
            }
            if (status_ve.value) {
                retryConnect.value = 0;
                return true;
            } else {
                retryConnect.value += 1;
                el_alert({
                    title: '自动重连中...',
                    message: `第${retryConnect.value}次`,
                    type: 'warning',
                })
                try {
                    await logout()
                    await login_ve({ username: username.value, password: password.value, passcode: '', loginType: '2' })
                } catch (error) {
                    continue
                }

            }
        }
        retryConnect.value = 0;
        el_alert({
            title: '错误',
            message: 've服务器连接失败',
            type: 'error',
            showClose: true,
            duration: 1000
        });
        return false
    }
    const checkAuth_app = async () => {
        try {
            const appUserInfo = await getUserInfo_app(username.value, password.value);
            userinfo.value = { ...userinfo.value, ...appUserInfo };
            status_app.value = true;
            return true
        } catch (error) {
            status_app.value = false;
            return false
        }
    }
    const checkAuthInterval = 5 * 60 * 1000; // 5 分钟的间隔，可按需调整
    const lastCheckTime = ref<number>(0);
    const lastCheckResult = ref<boolean>(false);
    const checkAuth = async () => {
        const now = Date.now();
        // 若在间隔时间内，直接返回缓存结果
        if (now - lastCheckTime.value < checkAuthInterval) {
            return lastCheckResult.value;
        }
        const result = await checkAuth_force();
        
        // 更新缓存时间和结果
        lastCheckTime.value = now;
        lastCheckResult.value = result;

        return result;
    };
    const checkAuth_force = async () => {
        const a = await checkAuth_ve()
        const b = await checkAuth_app()
        
        if (a || b) return true;
        return false
    }

    emitter.on('UPDATE_INFO', async () => {
        const UPDATE_INFOTask = async () => {
            isLoading.value = true;
            if (!await checkAuth()) return;
            try {
                await el_alert({
                    title: '信息更新中...',
                    message: `${new Date().toLocaleString()}`,
                    type: 'info',
                    showClose: true,
                    duration: 1000
                });
                const semesterRes = await getAllTerm();
                activeSemester.value = semesterRes[0];
                const xqCode = activeSemester.value?.xqCode;
                if (xqCode) {
                    const coursesRes = await getAllCourses(xqCode);
                    courseList.value = coursesRes;
                }
                try {
                    const response = await fetch(userinfo.value.avatarPath);
                    const blob = await response.blob();
                    useCache('avatar', URL.createObjectURL(blob))
                } catch {
                    useCache('avatar', '')
                    throw ('头像获取失败')
                }
            } catch (error) {
                el_alert({
                    title: '信息更新失败',
                    message: `${error}`,
                    type: 'error',
                    showClose: true,
                    duration: 1000
                });
            } finally {
                isLoading.value = false;
            }
        };
        addTaskToQueue(UPDATE_INFOTask);
    });

    const saveState = throttle(() => {
        localStorage.setItem(USER_STORAGE_KEY, encryptData({
            isAuthenticated: isAuthenticated.value,
            username: username.value,
            password: password.value,
            userinfo: userinfo.value,
            activeSemester: activeSemester.value,
            courseList: courseList.value,
            homeworkList: homeworkList.value
        }))
    }, 500)

    // 监听状态变化并持久化
    watch([isAuthenticated, username, password], saveState)
    watch([userinfo, activeSemester, courseList, homeworkList], saveState, { deep: true })

    return {
        isAuthenticated,
        username,
        password,
        isLoading,
        userinfo,
        activeSemester: activeSemester,
        courseList,
        homeworkList,
        handlelogout,
        go_kcpt,
        checkAuth_ve,
        status_ve,
        checkAuth_app,
        status_app,
        checkAuth,
        addTaskToQueue,
        Cache,
        checkAuth_force
    };
});