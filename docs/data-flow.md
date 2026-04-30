# 数据流向梳理

## 应用入口

`src/main.ts` 创建 Vue 应用，安装 Pinia 和 Router。`src/App.vue` 只承载全局背景、全局 loading 与一级 `RouterView`。

## 路由与认证

`src/router/index.ts` 的 `beforeEach` 会读取 `useUserStore()`：

- 未登录访问业务页时跳到 `/login`
- 已登录访问 `/login` 时回到 `/`
- 每次路由跳转都会触发 `useVisitData()`

登录页 `src/views/LoginView.vue` 调用 `src/api/auth.ts`：

- `getCaptcha(loginType)` 按登录方式获取验证码
- `login(params)` 组合调用 CAS / VE / APP 登录接口
- 登录成功后写入 `userStore.isAuthenticated`、`username`、`password`

## 全局业务状态

`src/stores/user.ts` 是当前主状态中心：

- 认证态：`isAuthenticated`、`username`、`password`
- 用户信息：`userinfo`
- 学期与课程：`activeSemester`、`courseList`
- 作业：`homeworkList`
- 轻新课堂状态：`status_app`
- 运行期缓存：`Cache`

store 会把认证信息加密写入 `localStorage:user_store`，把业务缓存写入 `localStorage:user_cache`。

## 数据刷新链路

`src/views/RootView.vue` 进入业务壳时调用 `userStore.refreshUserInfo()`：

1. `checkAuth()` 校验 VE 与 APP 登录状态
2. VE 用户信息写入 `userinfo`
3. 获取学期列表，第一项写入 `activeSemester`
4. 使用当前学期 `xqCode` 拉取课程，写入 `courseList`
5. 拉取头像并写入 `Cache.avatar`

`src/module/HomeWorkModule.vue` 挂载或收到 `UPDATE_HOMEWORKS` 事件时：

1. 通过任务队列调用 `userStore.refreshHomeworks()`
2. 根据 `courseList` 拉取所有课程作业，写入 `homeworkList`
3. 再调用 `userStore.refreshHomeworkDetails()` 补齐提交、分数、排名等详情

`src/module/DayCourseModule.vue` 直接调用 APP 课表接口，并把当天课表缓存到 `userStore.Cache.DayCourse`。

## 当前重构方向

- 页面/模块尽量只负责展示状态与触发 action
- API 返回值转换保留在 `src/api/**`
- 跨页面共享状态统一写入 Pinia store
- 纯展示规则放入 `src/utils/homework.ts` 这类纯函数文件
- 事件总线只保留真正需要跨组件广播的轻量事件
