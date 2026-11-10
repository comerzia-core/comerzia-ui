import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { AppRouter } from '../../src/routes/AppRouter';
import '../../src/index.css';

const signedIn=new URLSearchParams(location.search).has('signed-in');
useAuthStore.setState({status:signedIn?'authenticated':'anonymous',isAuthenticated:signedIn,isSessionReady:true,
 token:signedIn?'fixture':null,userProfile:signedIn?{id:'owner',username:'fixture',firstName:'Fixture',paternalLastName:'Test',maternalFirstName:null,
 fullName:'Fixture Test',email:'fixture@example.test',imageUrl:null,roles:['OWNER'],permissions:[],companySettings:null}:null});
createRoot(document.getElementById('root')!).render(
 <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>
  <ToastProvider><AppRouter/></ToastProvider>
 </QueryClientProvider>
);
