import { service } from "./instance";
import { extractAlertMessage } from "@/utils";
import axios from "axios";
import * as cheerio from "cheerio";

// 定义新的参数类型
export interface CASLoginParams {
    loginname: string;
    password: string; // 注意这里使用明文密码
    csrfmiddlewaretoken: string;
    captcha_0: string; // 验证码ID
    captcha_1: string; // 用户输入的验证码
}

export async function login_cas(params: CASLoginParams): Promise<boolean> {
    try {
        const response = await service.post('/auth/login/?next=/homespcace/', new URLSearchParams({
            next: '',
            csrfmiddlewaretoken: params.csrfmiddlewaretoken,
            loginname: params.loginname,
            password: params.password,
            captcha_0: params.captcha_0,
            captcha_1: params.captcha_1
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Upgrade-Insecure-Requests': '1',
            },
            withCredentials: true
        });
        
        const $ = cheerio.load(response.data);
        const captchaId = $('#id_captcha_0').val();
        const captchaUrl = $('.captcha').attr('src');
        const csrfmiddlewaretoken = $('input[name="csrfmiddlewaretoken"]').val() as string;
        const alertMessage = $('p.tishi').text()
            .replace(/\s+/g, '')  // 移除所有空白字符
            .trim();
        if (captchaId || captchaUrl || csrfmiddlewaretoken) {
            throw (alertMessage || '奇怪的错误，请查看控制台');
        }
        return true;
    } catch (error) {
        throw error;
    }
}

export const getCaptcha = async (): Promise<{captchaId: string; captchaUrl: string; csrfmiddlewaretoken: string}> => {
    try {
        const response = await service.get('/auth/login/', {
            withCredentials: true
        });
        const html = response.data;
        const $ = cheerio.load(html);

        // 获取验证码 ID
        const captchaId = $('#id_captcha_0').val();

        // 获取验证码图片 URL
        const captchaUrl = $('.captcha').attr('src');

        // 提取 csrfmiddlewaretoken
        const csrfmiddlewaretoken = $('input[name="csrfmiddlewaretoken"]').val() as string;
        
        // 生成图片 URL
        const response2 = await service.get<Blob>(`${captchaUrl}`, {
            responseType: 'blob',
            params: { _t: Date.now() } // 防止缓存
        })

        return {
            captchaId: Array.isArray(captchaId) ? captchaId[0] : (captchaId || ''),
            captchaUrl: URL.createObjectURL(new Blob([response2.data], { type: 'image/png' })),
            csrfmiddlewaretoken: csrfmiddlewaretoken || ''
        };
    } catch (error) {
        throw error
    }
}

export async function checkAuth(): Promise<boolean> {
    try {
        const service_mis = axios.create({
            baseURL: '/api_mis',// https://mis.bjtu.edu.cn
            withCredentials: true,
            timeout: 3000,
            maxRedirects: 0 // 禁止自动重定向
        })
        const response = await service_mis.post('/', {
            withCredentials: true
        });
        return true;
    } catch (error) {
        throw error;
    }
}