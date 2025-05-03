import CryptoJS from 'crypto-js';
const CRYPTO_SECRET = 'PowerByZYJiang';

export const md5 = (text: string): string => {
    return CryptoJS.MD5(text).toString();
}
export const encryptData = (data: any): string => {
    return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        CRYPTO_SECRET
    ).toString()
}

export const decryptData = <T>(ciphertext: string): T | null => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, CRYPTO_SECRET)
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    } catch (error) {
        console.error('解密失败，返回初始状态', error)
        return null
    }
}
