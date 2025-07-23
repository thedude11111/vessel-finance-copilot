import { Button } from "./ui/button";

export function GoogleLoginButton() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  return (
    <Button onClick={handleLogin}>
      Login with Google
    </Button>
  );
}
