// 鉴权方法
import { md5 } from "@/utils";
import { login_app } from "./api_app";
import { login_ve } from "./api_ve";
import type { CaptchaResponse, loginParams } from "./types"
import { login_cas } from "./api_cas";
import { getCaptcha as getCaptcha_ve, getCaptchaText as getCaptchaText_ve} from '@/api/api_ve'
import { getCaptcha as getCaptcha_cas } from '@/api/api_cas'

export const login = async (params: loginParams) => {
    const { username, password, passcode, loginType, captcha_id, csrfmiddlewaretoken} = params;
    switch (loginType) {
        case '1':
            await login_ve({ username, password: md5(password), passcode, loginType })
            await login_app(username, password)
            break
        case '2':
            await login_cas({ loginname: username, password: password, captcha_1: passcode, captcha_0: captcha_id, csrfmiddlewaretoken: csrfmiddlewaretoken })
            await login_ve({ username, password: md5(password), passcode, loginType })
            break
        default:
            throw new Error('loginType错误')
    }
}
export const getCaptcha = async (loginType: '1' | '2'):Promise<CaptchaResponse> => {
    switch (loginType) {
        case '1':
            return {
                captchaUrl:await getCaptcha_ve(),
                captchaId: '',
                csrfmiddlewaretoken: '',
                captchaText:await getCaptchaText_ve() 
            }
        case '2':
            const res = await getCaptcha_cas()
            return {
                captchaUrl:res.captchaUrl,
                captchaId: res.captchaId,
                csrfmiddlewaretoken: res.csrfmiddlewaretoken,
                captchaText:''
            }
        default:
            throw new Error('loginType错误')
    }
}
