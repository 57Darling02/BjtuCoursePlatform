import { ElMessageBox } from 'element-plus'
import { h } from 'vue'

export const showAboutDialog = (version?: string) => {
    const lines = [
        '课程平台青春版',
        version ? `版本：${version}` : '',
        '本来已经弃用了，但是想某电信兵王回归仍是大一',
        '让ai修好了给他玩💩',
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
        customClass: 'about-message-box a-card',
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
