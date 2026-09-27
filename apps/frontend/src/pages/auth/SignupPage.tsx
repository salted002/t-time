import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SignupAcademyStep from '@/components/auth/SignupAcademyStep';
import SignupAccountStep from '@/components/auth/SignupAccountStep';
import SignupCompleteStep from '@/components/auth/SignupCompleteStep';
import { useSignupState } from '@/types/useSignupStore';

interface SignupCompleteState {
  academyName: string;
  message: string;
  slug: string;
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
        <SignupAccountStep
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
        <SignupCompleteStep
          academyName={state.academyName}
          message={state.message}
          onContinue={() => navigate(`/${state.slug}/students`)}
        />
      );
    }
    case 'academy':
    default:
      return (
        <SignupAcademyStep
          academyInfo={academyInfo}
          onNext={(data) => {
            setAcademyInfo(data);
            navigate('/signup?step=account');
          }}
        />
      );
  }
}
