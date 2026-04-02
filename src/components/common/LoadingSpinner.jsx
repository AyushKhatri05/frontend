const LoadingSpinner = ({ size = 'medium' }) => {
    const sizes = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12'
    };

    return (
        <div className="flex justify-center items-center">
            <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizes[size]}`}></div>
        </div>
    );
};

export default LoadingSpinner;