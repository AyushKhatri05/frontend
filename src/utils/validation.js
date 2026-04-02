export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const isValidPhone = (phone) => {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
};

export const isValidPassword = (password) => {
    return password && password.length >= 8;
};

export const isValidSKU = (sku) => {
    const re = /^[A-Z0-9-]{3,50}$/;
    return re.test(sku);
};

export const isValidPrice = (price) => {
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0;
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/<[^>]*>/g, '').trim();
};