import { ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { md5 } from './cryption'
import { el_alert } from './show'

export const DEVELOPER_MODE_PASSPHRASE_MD5 = 'REDACTED_PASSPHRASE_MD5'
export const USE_DEV_FIXED_HELPER_CREDENTIALS = true
export const DEV_HELPER_USERNAME = ''
export const DEV_HELPER_PASSWORD = ''
export const DEV_HELPER_DIALOG_MESSAGE = '越权模式：确认后将使用特权账号提交，22251285干的，因为我只把密钥给他了。'

export const developerModeEnabled = ref<boolean>(false)

export const setDeveloperModeEnabled = (enabled: boolean) => {
    developerModeEnabled.value = enabled
}

export const isDeveloperModePassphraseValid = (passphrase: string) => {
    return md5(passphrase.trim()) === DEVELOPER_MODE_PASSPHRASE_MD5
}

export const tryEnableDeveloperMode = (passphrase: string) => {
    if (!isDeveloperModePassphraseValid(passphrase)) return false
    setDeveloperModeEnabled(true)
    return true
}

export const disableDeveloperMode = () => {
    setDeveloperModeEnabled(false)
}

export const showDeveloperModeRequiredAlert = (fromSidebar = false) => {
    el_alert({
        title: '功能未开启',
        message: fromSidebar ? '请先在侧边栏开启开发者模式' : '请先开启开发者模式',
        type: 'warning',
    })
}

export const beforeDeveloperModeSwitchChange = async () => {
    if (developerModeEnabled.value) {
        el_alert({
            title: '开发者模式已关闭',
            message: '越权提交功能已禁用',
            type: 'success',
        })
        return true
    }
    try {
        const { value } = await ElMessageBox.prompt(
            '请输入开发者口令',
            '开发者模式',
            {
                confirmButtonText: '开启',
                cancelButtonText: '取消',
                inputType: 'password',
                closeOnClickModal: false,
            }
        )
        if (!isDeveloperModePassphraseValid(value ?? '')) {
            el_alert({
                title: '口令错误',
                message: '开发者口令不正确',
                type: 'error',
            })
            return false
        }
        el_alert({
            title: '开发者模式已开启',
            message: '越权功能已开启，后果自负！！！',
            type: 'success',
        })
        return true
    } catch {
        return false
    }
}
