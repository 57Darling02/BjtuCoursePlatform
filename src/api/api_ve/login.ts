import { service } from "./instance";
import { extractAlertMessage } from "@/utils";
import { logout } from "./logout";

//定义输入参数类型
export interface ve_loginParams {
    username: string,
    password: string,
    passcode: string,
    loginType: '1' | '2' 
}

export async function login_ve(loginparams: ve_loginParams): Promise<boolean> {
    const { username, password, passcode, loginType } = loginparams;
    try {
        const response = await service.post('/s.shtml',
            new URLSearchParams({
                login: 'main_2',
                qxkt_type: '',
                qxkt_url: '',
                username,
                password,
                passcode,
                loginType
            }), {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                'Cache-Control': 'no-cache',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        const alertMessage = extractAlertMessage(response.data);
        if (alertMessage) {
            throw alertMessage
        }
        return true
    } catch (error) {
        throw error;
    }
}

export const modifyPassword = async (newPassword: string) => {
    try {
        const response = await service.post(
            '/back/personalCenter/personalCenter.shtml',
            {
                newpassword: newPassword
            },
            {
                params: {
                    method: 'passwordSave'
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                withCredentials: true 
            }
        ); 
        if (response.data && response.data.STATUS == 0) return true;
        throw ('修改密码失败'+response.data )
    } catch (error) {
        throw error;
    }
}