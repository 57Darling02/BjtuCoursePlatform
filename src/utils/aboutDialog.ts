import { ElMessageBox } from 'element-plus'
import { h } from 'vue'

export const showAboutDialog = (version?: string) => {
    const lines = [
        '课程平台青春版',
        version ? `版本：${version}` : '',
        'Powered by 57Darling02',
    ].filter(Boolean)

    return ElMessageBox({
        title: '关于',
        message: h(
            'div',
            { class: 'about-dialog-content' },
            lines.map((line) => h('div', line))
        ),
        customClass: 'about-message-box',
        confirmButtonText: '知道了',
        closeOnClickModal: true,
        closeOnPressEscape: true,
        showClose: true,
    })
}
