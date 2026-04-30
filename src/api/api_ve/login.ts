import { service } from "./instance";
import { service as appService } from "../api_app/instance";

//定义输入参数类型
interface VeLoginParams {
    username: string;
    password: string;
    passcode: string;
    loginType: "1" | "2";
}

export async function login_ve(loginparams: VeLoginParams): Promise<boolean> {
    const { username, password, passcode, loginType } = loginparams;
    try {
        await service.post(
            "/s.shtml",
            new URLSearchParams({
                login: "main_2",
                qxkt_type: "",
                qxkt_url: "",
                username,
                password,
                passcode,
                loginType,
            }),
            {
                headers: {
                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                    "Cache-Control": "no-cache",
                    "Upgrade-Insecure-Requests": "1",
                },
            }
        );
        await syncCoursePlatformSession();
        return true;
    } catch (error) {
        throw error;
    }
}

export const syncCoursePlatformSession = async (): Promise<string> => {
    const response = await service.get<string>(
        "/back/coursePlatform/coursePlatform.shtml",
        {
            params: {
                method: "toCoursePlatformIndex",
            },
            headers: {
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        }
    );

    const sessionId = extractCoursePlatformSessionId(String(response.data || ""));
    if (!sessionId) {
        throw new Error("无法从课程平台首页解析sessionId");
    }

    setCoursePlatformSessionId(sessionId);
    return sessionId;
};

const extractCoursePlatformSessionId = (html: string): string | null => {
    const headerMatch = html.match(/setRequestHeader\(\s*["']sessionId["']\s*,\s*["']([^"']+)["']\s*\)/i);
    if (headerMatch?.[1]) return headerMatch[1];

    const urlMatch = html.match(/[?&]sessionId=([A-Za-z0-9]+)/);
    return urlMatch?.[1] || null;
};

const setCoursePlatformSessionId = (sessionId: string) => {
    localStorage.setItem("sessionId", sessionId);
    service.defaults.headers.common["sessionId"] = sessionId;
    appService.defaults.headers.common["sessionId"] = sessionId;
};

export const modifyPassword = async (newPassword: string) => {
    try {
        const response = await service.post(
            "/back/personalCenter/personalCenter.shtml",
            {
                newpassword: newPassword,
            },
            {
                params: {
                    method: "passwordSave",
                },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                withCredentials: true,
            }
        );
        if (response.data && response.data.STATUS == 0) return true;
        throw "修改密码失败" + response.data;
    } catch (error) {
        throw error;
    }
};
