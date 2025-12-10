import { useNavigate } from 'react-router-dom';
import { OnboardingScreen } from '../components/screens/OnboardingScreen';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // If user already completed onboarding, redirect to /pro
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/pro', { replace: true });
    }
  }, [user, navigate]);

  const handleComplete = () => {
    navigate('/pro', { replace: true });
  };

  return <OnboardingScreen onComplete={handleComplete} />;
}
