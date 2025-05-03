import { type NotificationOptions } from 'element-plus';
export const el_alert = (data: {title?: string, message?: string, type?: string, showClose?: boolean, customClass?: string, dangerouslyUseHTMLString?: boolean, duration?: number, offset?: number, position?: string}) => {
  ElNotification(data);
};
export const extractAlertMessage = (html: string): string | null => {
  try {
    // 兼容单双引号的正则表达式
    const alertRegex = /alert\(['"]([^'"]+)['"]\)/i
    const match = html.match(alertRegex)
    return match ? match[1] : null
  } catch (error) {
    console.error('解析 alert 内容失败:', error)
    return null
  }
}