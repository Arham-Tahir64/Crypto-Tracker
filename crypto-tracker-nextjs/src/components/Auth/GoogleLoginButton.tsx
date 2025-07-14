import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton() {
  return (
    <GoogleLogin
      onSuccess={credentialResponse => {
        // Send credentialResponse.credential (JWT) to backend for verification or user creation
        console.log(credentialResponse);
      }}
      onError={() => {
        console.log('Login Failed');
      }}
    />
  );
}