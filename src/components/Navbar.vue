<template>
    <nav class="app-navbar" aria-label="顶部导航">
        <div class="nav-menu">
            <el-dropdown
                class="nav-dropdown"
                popper-class="app-navbar-dropdown"
                trigger="hover"
                :show-timeout="80"
                :hide-timeout="120"
                @command="handleMenuCommand"
            >
                <button
                    class="nav-item nav-menu-trigger"
                    type="button"
                >
                    <i class="fa-solid fa-compass nav-menu-icon" aria-hidden="true" />
                    <span>导航</span>
                </button>

                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                            v-for="item in menuItems"
                            :key="item.key"
                            :command="item.key"
                            :divided="item.divided === true"
                            :class="{
                                'dropdown-item-active': item.routeName ? isActiveRoute(item.routeName) : false,
                                'dropdown-item-danger': item.danger === true
                            }"
                        >
                            <i :class="item.icon" aria-hidden="true" />
                            <span>{{ item.label }}</span>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <button class="nav-item nav-profile" type="button" aria-label="打开个人中心" @click="visible = true">
            <i class="fa-solid fa-user" aria-hidden="true" />
            <span>个人</span>
        </button>
    </nav>

    <el-drawer
        v-model="visible"
        class="profile-drawer"
        :size="300"
        :append-to-body="true"
        :destroy-on-close="true"
    >
        <Submenu v-if="visible" />
    </el-drawer>
</template>

<script lang='ts' setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showAboutDialog } from '@/utils/aboutDialog'
import Submenu from './Submenu.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const visible = ref(false)

const menuItems = [
    { key: 'home', label: '作业', routeName: 'home', icon: 'fa-solid fa-file-pen' },
    { key: 'learn', label: '课程学习', routeName: 'learn', icon: 'fa-solid fa-book-open' },
    { key: 'ai', label: '交大AI', icon: 'fa-solid fa-wand-magic-sparkles', action: () => userStore.go_ai() },
    { key: 'course-platform', label: '官方课程平台', icon: 'fa-solid fa-arrow-up-right-from-square', action: () => userStore.go_kcpt() },
    { key: 'about', label: '关于', icon: 'fa-solid fa-circle-info', action: () => showAboutDialog() },
    { key: 'logout', label: '重新登录', icon: 'fa-solid fa-right-from-bracket', action: () => handleLogout(), divided: true, danger: true },
]

const isActiveRoute = (routeName: string) => {
    return route.name === routeName || route.matched.some(item => item.name === routeName)
}

const navigateTo = (routeName: string) => {
    if (isActiveRoute(routeName)) return
    router.push({ name: routeName })
}

const handleMenuCommand = (command: string | number | object) => {
    if (typeof command !== 'string') return
    const target = menuItems.find(item => item.key === command)
    if (!target) return

    if (target.routeName) {
        navigateTo(target.routeName)
        return
    }

    target.action?.()
}

const handleLogout = () => {
    void userStore.handlelogout()
}
</script>


<style lang="scss" scoped>
$nav-height: 42px;
$nav-gap: 4px;
$transition-time: 0.25s;

.app-navbar {
    height: $nav-height;
    max-width: min(94vw, 760px);
    margin: $nav-gap auto 0;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.55);
    background-color: rgba(255, 255, 255, 0.58);
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(12px);
}

.nav-menu {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.nav-dropdown {
    height: 100%;
    display: flex;
}

.nav-item {
    position: relative;
    height: 100%;
    border: none;
    outline: none;
    color: #26394d;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 10px;
    line-height: 1;
    font: inherit;
    white-space: nowrap;
    transition:
        color $transition-time ease,
        background-color $transition-time ease;

    &::after {
        content: '';
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 6px;
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(to right, #3498db, #2980b9);
        transform: scaleX(0);
        transform-origin: left center;
        transition: transform $transition-time ease;
        pointer-events: none;
    }

    &:hover {
        color: #0f5f9c;
        background-color: rgba(255, 255, 255, 0.38);
    }

    &:hover::after {
        transform: scaleX(1);
    }
}

.nav-item span {
    display: inline-flex;
    align-items: center;
    font-size: 0.95rem;
    font-weight: 600;
}

.nav-item > i {
    flex: 0 0 1em;
    width: 1em;
    font-size: 1rem;
    line-height: 1;
    text-align: center;
}


.nav-menu-icon {
    transition: transform $transition-time ease;
    transform-origin: center;
}

.nav-dropdown:hover .nav-menu-icon,
.nav-menu-trigger:hover .nav-menu-icon {
    transform: rotate(180deg);
}

.nav-profile {
    flex: 0 0 auto;
}

:global(.app-navbar-dropdown) {
    border: none;
    border-radius: 16px;
    overflow: hidden;
    background: transparent;
    box-shadow: 0 12px 30px rgba(31, 38, 135, 0.12);
}

:global(.app-navbar-dropdown .el-dropdown-menu) {
    min-width: 142px;
    padding: 6px;
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(12px);
}

:global(.app-navbar-dropdown .el-dropdown-menu__item) {
    gap: 8px;
    border-radius: 10px;
    color: #26394d;
}

:global(.app-navbar-dropdown .el-dropdown-menu__item:not(.is-disabled):focus),
:global(.app-navbar-dropdown .el-dropdown-menu__item:not(.is-disabled):hover),
:global(.app-navbar-dropdown .el-dropdown-menu__item.dropdown-item-active) {
    color: #0f5f9c;
    background-color: rgba(52, 152, 219, 0.12);
}

:global(.app-navbar-dropdown .el-dropdown-menu__item.dropdown-item-danger) {
    color: #c0392b;
}

:global(.app-navbar-dropdown .el-dropdown-menu__item.dropdown-item-danger:not(.is-disabled):focus),
:global(.app-navbar-dropdown .el-dropdown-menu__item.dropdown-item-danger:not(.is-disabled):hover) {
    color: #c0392b;
    background-color: rgba(192, 57, 43, 0.12);
}

:global(.profile-drawer.el-drawer) {
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
}

@media (max-width: 640px) {
    .app-navbar {
        max-width: calc(100vw - 16px);
        padding: 0 6px;
        gap: 2px;
    }

    .nav-item {
        padding: 0 8px;

        span {
            display: none;
        }

        &::after {
            left: 8px;
            right: 8px;
        }
    }

    .nav-menu-trigger {
        min-width: $nav-height;
    }
}
</style>
