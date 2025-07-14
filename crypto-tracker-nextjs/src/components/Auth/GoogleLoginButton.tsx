import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';

interface GoogleLoginButtonProps {
  onLogin?: (user: any) => void;
}

export default function GoogleLoginButton({ onLogin }: GoogleLoginButtonProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setIsLoading(true);
      try {
        // Send credential to backend
        const response = await fetch('http://localhost:5000/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credential: credentialResponse.credential
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const decoded = jwtDecode(credentialResponse.credential);
          setUser(decoded);
          if (onLogin) onLogin(decoded);
        } else {
          console.error('Backend authentication failed');
        }
      } catch (error) {
        console.error('Error during authentication:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-md">
          Loading...
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            console.log('Login Failed');
          }}
        />
      )}
    </>
  );
}