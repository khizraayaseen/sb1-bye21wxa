const AuthLoader = () => {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
        <p className="mt-4 text-lg font-semibold text-gray-400">
          Checking Authentication...
        </p>
      </div>
    );
  };
  
  export default AuthLoader;
  