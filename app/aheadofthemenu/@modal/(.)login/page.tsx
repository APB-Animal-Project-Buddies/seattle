import { AuthModal } from "@/components/auth/AuthModal";
import { LoginForm } from "@/components/auth/LoginForm";

// Intercepts a soft navigation to /aheadofthemenu/login → renders as a modal.
export default function LoginModal() {
  return (
    <AuthModal>
      <LoginForm />
    </AuthModal>
  );
}
