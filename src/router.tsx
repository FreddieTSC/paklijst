import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { TripsListPage } from './features/trips/TripsListPage';
import { TripCompositorPage } from './features/trips/TripCompositorPage';
import { TripDetailPage } from './features/trips/TripDetailPage';
import { LibraryPage } from './features/library/LibraryPage';
import { ProfilePage } from './features/profile/ProfilePage';

export const router = createBrowserRouter([
  { path: '/login',      element: <LoginPage /> },
  { path: '/signup',     element: <Navigate to="/login" replace /> },
  { path: '/onboarding', element: <Navigate to="/trips" replace /> },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/trips" replace /> },
      { path: 'trips',          element: <TripsListPage /> },
      { path: 'trips/new',      element: <TripCompositorPage /> },
      { path: 'trips/:tripId',  element: <TripDetailPage /> },
      { path: 'library',        element: <LibraryPage /> },
      { path: 'profile',        element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
