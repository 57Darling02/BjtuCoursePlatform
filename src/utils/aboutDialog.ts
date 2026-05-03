import { ElMessageBox } from 'element-plus'
import { h } from 'vue'

export const showAboutDialog = () => {
    const lines = [
        '课程平台青春版',
        `版本：${__APP_VERSION__}`,
        '感谢 @上条当咩 提供的服务器和域名',
        'Powered by 57Darling02',
    ].filter(Boolean)

    return ElMessageBox({
        title: '关于',
        message: h(
            'div',
            { class: 'about-dialog-content' },
            lines.map((line) => h('div', line))
        ),
        confirmButtonText: '知道了',
        closeOnClickModal: true,
        closeOnPressEscape: true,
        showClose: true,
        distinguishCancelAndClose: true,
    })
        .catch((action: unknown) => {
            if (action === 'cancel' || action === 'close') return
            return Promise.reject(action)
        })
}
