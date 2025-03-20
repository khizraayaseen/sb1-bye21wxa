import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, ensureCustomerRecord } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session?.user) throw new Error('No user data found');

        // Ensure customer record exists
        await ensureCustomerRecord(
          session.user.id,
          session.user.email!,
          session.user.user_metadata?.full_name
        );

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        navigate('/login?error=auth');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;