import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { el_alert, decryptData, encryptData, md5 } from '@/utils';
import {
    type TermInfo,
    type CourseInfo,
    type HomeworkItem,
    type UserInfo,
} from '@/api';

import {
    logout,
    login_ve,
    getUserInfo as getUserInfo_ve,
    getAllTerm,
    getAllCourses,
    getAllHomeworkItem,
    getAllStudentSubmissions,
    modifyPassword,
} from '@/api/api_ve';
import router from '@/router';
import { throttle } from 'lodash-es';
const USER_STORAGE_KEY = 'user_store'
const CACHE_STORAGE_KEY = 'user_cache'

interface AuthCheckOptions {
    silent?: boolean
}

interface ReconnectOptions {
    notify?: boolean
}

export const useUserStore = defineStore('user', () => {
    // 从 localStorage 恢复状态，如果没有则使用默认值
    const storedState = localStorage.getItem(USER_STORAGE_KEY);
    const cachedState = localStorage.getItem(CACHE_STORAGE_KEY);
    const storedAuthData = storedState
        ? decryptData<{ isAuthenticated: boolean; username: string; password: string }>(storedState)
        : null;
    const cachedData = cachedState
        ? JSON.parse(cachedState)
        : {
            userinfo: null,
            activeSemester: null,
            courseList: [],
            homeworkList: [],
            Cache: {},
        };

    // 合并认证数据和缓存数据到初始状态
    const initialState = {
        isAuthenticated: storedAuthData?.isAuthenticated ?? false,
        username: storedAuthData?.username ?? '',
        password: storedAuthData?.password ?? '',
        ...cachedData,
    };

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
    const Cache = ref<Record<string, any>>(initialState.Cache || {});
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
            if (!isAuthenticated.value) {
                taskQueue.value = []
                break
            }
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
            username.value = ''
            password.value = ''
            activeSemester.value = null
            courseList.value = []
            homeworkList.value = []
            Cache.value = {}
            saveCache.flush()
            saveState.flush()
            router.push('/login')

        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const handleSyncPassword = () => {
        ElMessageBox.confirm(
            '是否需要将课程平台和轻新课堂APP的密码同步设置为统一认证的密码？强烈建议同步。(如果不同步，则下次访问时将无法自动登入，同时也无法使用轻新课堂APP相关的功能。)',
            '同步密码',
            {
                confirmButtonText: '同步',
                cancelButtonText: '蒜鸟',
                type: 'info',
            }
        )
            .then(() => {
                modifyPassword(password.value)
            })
            .catch(() => {
                ElNotification({
                    type: 'info',
                    message: '同步了也没啥影响，建议同步',
                })
            })
    }

    const go_kcpt = async () => {
        await logout();
        setTimeout(() => {
            window.location.href = `http://123.121.147.7:88/ve/s.shtml?username=${username.value}&loginType=2&login=main_2`;
        }, 500);
    }

    let isCheckingAuth = false

    const checkAuth_ve = async (options: AuthCheckOptions = {}) => {
        const silent = options.silent ?? true;
        // 如果已经在检查，则返回当前状态的Promise
        if (isCheckingAuth) {
            console.log('已有checkAuth_ve实例在运行，跳过本次调用')
            return new Promise<boolean>(resolve => {
                const checkInterval = setInterval(() => {
                    if (!isCheckingAuth) {
                        clearInterval(checkInterval)
                        resolve(status_ve.value)
                    }
                }, 500)
            })
        }

        // 设置执行标志
        isCheckingAuth = true

        if (!isAuthenticated.value) {
            isCheckingAuth = false
            return false
        }

        try {
            const veUserInfo = await getUserInfo_ve()
            userinfo.value = { ...userinfo.value, ...veUserInfo }
            status_ve.value = true
            return true
        } catch (error) {
            console.error('获取VE用户信息失败:', error)
            status_ve.value = false
            if (!silent) {
                el_alert({
                    title: '连接错误',
                    message: '无法连接到VE服务器，请检查网络连接或重新登录',
                    type: 'error',
                    showClose: true,
                    duration: 3000
                })
            }
            return false
        } finally {
            retryConnect.value = 0
            isCheckingAuth = false
        }
    }
    const checkAuth_app = async () => {
        if (!isAuthenticated.value) {
            status_app.value = false;
            return false
        }
        status_app.value = Boolean(localStorage.getItem('sessionId'));
        return status_app.value
    }
    const checkAuthInterval = 5 * 60 * 1000; // 5 分钟的间隔，可按需调整
    const lastCheckTime = ref<number>(0);
    const lastCheckResult = ref<boolean>(false);
    const checkAuth = async (options: AuthCheckOptions = {}) => {
        const now = Date.now();
        // 若在间隔时间内，直接返回缓存结果
        if (now - lastCheckTime.value < checkAuthInterval) {
            return lastCheckResult.value;
        }
        const result = await checkAuth_force(options);

        // 更新缓存时间和结果
        lastCheckTime.value = now;
        lastCheckResult.value = result;

        return result;
    };
    const checkAuth_force = async (options: AuthCheckOptions = {}) => {
        const silent = options.silent ?? true;
        const a = await checkAuth_ve(options)
        const b = await checkAuth_app()
        if (a && !b && !silent) {
            el_alert({
                title: '警告',
                message: '网页端服务器连接成功，但轻新课堂服务器连接失败,已挂起轻新课堂相关功能',
                type: 'warning',
                showClose: true,
                duration: 3000
            });
        }
        if (a || b) return true;
        return false
    }

    const reconnectVe = async () => {
        if (await checkAuth_ve({ silent: true })) return true;
        if (!username.value || !password.value) {
            status_ve.value = false;
            return false;
        }

        try {
            try {
                await logout();
            } catch (error) {
                console.warn('VE重连前退出旧会话失败，继续尝试登录:', error);
            }
            await login_ve({
                username: username.value,
                password: md5(password.value),
                passcode: '',
                loginType: '2',
            });
            return await checkAuth_ve({ silent: true });
        } catch (error) {
            console.error('VE重连失败:', error);
            status_ve.value = false;
            return false;
        }
    }

    const reconnect = async (options: ReconnectOptions = {}) => {
        const notify = options.notify ?? true;
        const veConnected = await reconnectVe();
        const appConnected = await checkAuth_app();
        const success = veConnected || !!appConnected;
        lastCheckTime.value = Date.now();
        lastCheckResult.value = success;
        if (notify) {
            el_alert({
                title: success ? '重连完成' : '重连失败',
                message: `VE：${status_ve.value ? '已连接' : '未连接'}；APP：${status_app.value ? '已连接' : '未连接'}`,
                type: success ? 'success' : 'error',
                showClose: true,
                duration: 2000
            });
        }
        return success;
    }

    const refreshUserInfoTask = async () => {
        if (userinfo.value == null) isLoading.value = true;
        try {
            if (!await checkAuth({ silent: true })) return;
            const semesterRes = await getAllTerm();
            activeSemester.value = semesterRes[0];
            const xqCode = activeSemester.value?.xqCode;
            if (xqCode) {
                courseList.value = await getAllCourses(xqCode);
            }
            try {
                const response = await fetch(userinfo.value.avatarPath);
                const blob = await response.blob();
                useCache('avatar', URL.createObjectURL(blob))
            } catch {
                useCache('avatar', '')
                throw ('头像获取失败')
            }
            await el_alert({
                title: '用户数据',
                message: `${new Date().toLocaleString()}更新成功`,
                type: 'success',
                showClose: true,
                duration: 1000
            });
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

    const refreshUserInfo = () => {
        addTaskToQueue(refreshUserInfoTask);
    };

    const refreshHomeworks = async () => {
        if (!await checkAuth_ve({ silent: true })) return;
        if (courseList.value.length === 0) return;
        try {
            homeworkList.value = await getAllHomeworkItem(courseList.value.map(course => course.id));
            el_alert({
                title: '作业信息更新',
                message: `${new Date().toLocaleString()}`,
                type: 'success',
                showClose: true,
                duration: 1000
            });
        } catch (error) {
            el_alert({
                title: '作业加载失败',
                message: `${error}`,
                type: 'error',
                showClose: true,
                duration: 0
            });
        }
    };

    const refreshHomeworkDetails = async () => {
        if (!await checkAuth_ve({ silent: true })) return;
        try {
            if (courseList.value.length === 0) {
                el_alert({
                    title: '',
                    message: '无课程信息',
                    type: 'warning',
                    showClose: true,
                    duration: 1000
                });
                return;
            };
            for (const homework of homeworkList.value) {
                const allSubmissions = (await getAllStudentSubmissions(homework.id)).sort((a, b) => {
                    const scoreA = a.score as number | null
                    const scoreB = b.score as number | null
                    if (scoreA === null) return 1
                    if (scoreB === null) return -1
                    return scoreB - scoreA
                })
                homework.detail = {
                    my_homework: homework.detail?.my_homework,
                    courseNoteList: allSubmissions,
                    topFive: allSubmissions.filter((item) => item.pgFlag !== 's').slice(0, 5).map((item) => item.id)
                }
                const mhw = allSubmissions.filter((item) => item.pgFlag !== 's').find((item) => item.id == homework.detail?.my_homework)
                if (mhw) {
                    homework.status = 2;
                    homework.detail.score = Number(mhw.score);
                    homework.detail.rank = allSubmissions.filter((item) => item.pgFlag !== 's').findIndex((item) => item.id == homework.detail?.my_homework) + 1;
                    homework.detail.is_excellent = Number(mhw.is_excellent);
                    homework.detail.average_score = allSubmissions.filter((item) => item.pgFlag !== 's').map((item) => Number(item.score)).reduce((a, b) => a + b, 0) / allSubmissions.filter((item) => item.pgFlag !== 's').length;
                    homework.detail.comment = mhw.content;
                }
            }
            el_alert({
                title: '作业细节更新',
                message: `${new Date().toLocaleString()}`,
                type: 'success',
                showClose: true,
                duration: 1000
            });
        } catch (error) {
            el_alert({
                title: '作业细节加载失败',
                message: `${error}`,
                type: 'error',
                showClose: true,
                duration: 800
            });
        }
    };

    const saveState = throttle(() => {
        localStorage.setItem(
            USER_STORAGE_KEY,
            encryptData({
                isAuthenticated: isAuthenticated.value,
                username: username.value,
                password: password.value,
            })
        );
    }, 500);

    const saveCache = throttle(() => {
        localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify({
                userinfo: userinfo.value,
                activeSemester: activeSemester.value,
                courseList: courseList.value,
                homeworkList: homeworkList.value,
                Cache: Cache.value,
            })
        );
    }, 1000);

    // 监听状态变化并持久化
    watch([isAuthenticated, username, password], saveState);
    watch([userinfo, activeSemester, courseList, homeworkList, Cache], saveCache, { deep: true });

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
        handleSyncPassword,
        checkAuth_ve,
        status_ve,
        checkAuth_app,
        status_app,
        checkAuth,
        reconnect,
        addTaskToQueue,
        refreshUserInfo,
        refreshHomeworks,
        refreshHomeworkDetails,
        Cache,
        checkAuth_force
    };
});
