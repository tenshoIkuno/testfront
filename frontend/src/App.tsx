import useAuthRedirect from './hooks/useAuthRedirect';
import LoginScreen from './components/layout/LoadingScreen';
import MainScreen from './MainScreen';

export default function App() {
  const {
    loading,
    logout,
    userData,
    companyStatus,
    accessToken,
    authLogs,
    downloadLogs,
  } = useAuthRedirect();

  if (loading || !userData || !accessToken) {
    return <LoginScreen loadingFlag={1} />;
  }

  return (
    <MainScreen
      logout={logout}
      userData={userData}
      companyStatus={companyStatus ?? false}
      accessToken={accessToken}
      authLogs={authLogs}
      downloadLogs={downloadLogs}
    />
  );
}
