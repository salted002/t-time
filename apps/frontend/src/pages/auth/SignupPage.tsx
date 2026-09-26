import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SignupStep1Page from '@/pages/auth/SignupStep1Page';
import SignupStep2Page from '@/pages/auth/SignupStep2Page';
import SignupStep3Page from '@/pages/auth/SignupStep3Page';
import { useSignupState } from '@/types/useSignupStore';

interface SignupCompleteState {
  academyName: string;
  message: string;
}

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const step = searchParams.get('step') ?? 'academy';
  const { academyInfo, setAcademyInfo, reset } = useSignupState();

  switch (step) {
    case 'account':
      return (
        <SignupStep2Page
          academyInfo={academyInfo}
          onPrev={() => navigate('/signup?step=academy')}
          onSuccess={(result) => {
            reset();
            navigate('/signup?step=complete', { state: result });
          }}
        />
      );
    case 'complete': {
      const state = location.state as SignupCompleteState | null;
      if (!state?.academyName) {
        return <Navigate to="/signup?step=academy" replace />;
      }
      return (
        <SignupStep3Page
          academyName={state.academyName}
          message={state.message}
          onGoToLogin={() => navigate('/login')}
        />
      );
    }
    case 'academy':
    default:
      return (
        <SignupStep1Page
          academyInfo={academyInfo}
          onNext={(data) => {
            setAcademyInfo(data);
            navigate('/signup?step=account');
          }}
        />
      );
  }
}
