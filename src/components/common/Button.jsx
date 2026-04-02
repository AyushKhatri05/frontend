const Button = ({ children, variant = 'primary', size = 'medium', onClick, disabled, className = '', type = 'button', ...props }) => {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    };

    const sizes = {
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2 text-base',
        large: 'px-6 py-3 text-lg'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;