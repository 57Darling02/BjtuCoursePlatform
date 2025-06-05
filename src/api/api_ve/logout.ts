import { service } from "./instance";

export const logout = async (): Promise<boolean> => {
    try {
        await service.get('/Exit_2.jsp')
        return true
    } catch (error) {
        throw ('退出登录失败，请重试' + error as string)
    }
}

