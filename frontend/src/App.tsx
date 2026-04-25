import { type ReactNode } from 'react';
import {
  createHashRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import GroupsListPage from './pages/GroupsListPage';
import GroupDetailPage from './pages/GroupDetailPage';
import JoinPage from './pages/JoinPage';

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootIndex() {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (currentUser) return <Navigate to="/groups" replace />;
  return <AuthPage />;
}

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RootIndex /> },
      { path: 'join/:token', element: <JoinPage /> },
      {
        path: 'groups',
        element: (
          <RequireAuth>
            <GroupsListPage />
          </RequireAuth>
        ),
      },
      {
        path: 'groups/:id',
        element: (
          <RequireAuth>
            <GroupDetailPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
