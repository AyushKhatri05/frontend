export const generateRandomString = (length = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const maskSensitiveData = (data, fields = ['password', 'token']) => {
    if (typeof data !== 'object' || data === null) return data;
    const masked = Array.isArray(data) ? [...data] : { ...data };
    Object.keys(masked).forEach(key => {
        if (fields.includes(key)) {
            masked[key] = '********';
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitiveData(masked[key], fields);
        }
    });
    return masked;
};