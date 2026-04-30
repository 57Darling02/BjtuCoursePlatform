import { service } from "./instance";
import { extractAlertMessage } from "@/utils";
import { logout } from "./logout";

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
        const response = await service.post(
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
        // const alertMessage = extractAlertMessage(response.data);
        // if (alertMessage) {
        //     throw alertMessage
        // }
        // 访问api/back/core/main/index.shtml?method=index&type=qxkt 正确的话将返回302，我们不需要跳转，但是需要得到响应头中的Location中的sessionid，例如
        // http://123.121.147.7:88/ve/back/coursePlatform/coursePlatform.shtml?method=toCoursePlatformIndex&sessionId=6264B6E14F334D7482314E1DAF9D3106
        // try {
        //     // 禁止自动重定向以获取302响应头，添加validateStatus允许302状态码
        //     const response_2 = await service.get(
        //         "/back/core/main/index.shtml?method=index&type=qxkt",
        //         {
        //             withCredentials: true,
        //         }
        //     );

        //     // 从response_2获取location头
        //     const location = response_2.headers["location"];
        //     if (location) {
        //         try {
        //             // 处理相对路径URL（使用当前请求URL作为基准）
        //             const fullUrl = new URL(location, 'http://123.121.147.7:88/');
        //             const urlParams = new URLSearchParams(fullUrl.search);
        //             const sessionId = urlParams.get("sessionId");

        //             if (sessionId) {
        //                 console.log("提取到的sessionId:", sessionId);
        //                 // 将sessionId存储到localStorage
        //                 localStorage.setItem("sessionId", sessionId);
        //                 service.defaults.headers.common['sessionId'] = localStorage.getItem("sessionId") || ''
        //             } else {
        //                 throw new Error("Location URL中未找到sessionId参数");
        //             }
        //         } catch (urlError) {
        //             console.error("解析Location URL失败:", urlError);
        //             // 添加备用解析方案 - 直接字符串匹配sessionId参数
        //             const sessionIdMatch = location.match(/sessionId=([^&]+)/);
        //             if (sessionIdMatch && sessionIdMatch[1]) {
        //                 console.log("备用方案提取到的sessionId:", sessionIdMatch[1]);
        //                 localStorage.setItem("sessionId", sessionIdMatch[1]);
        //             } else {
        //                 throw new Error("无法解析sessionId: " + urlError.message);
        //             }
        //         }
        //     } else {
        //         throw new Error("响应头中未找到Location字段");
        //     }
        // } catch (error) {
        //     console.error("获取sessionId失败:", error);
        //     throw error; // 继续抛出错误让上层处理
        // }
        
        return true;
    } catch (error) {
        throw error;
    }
}

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
