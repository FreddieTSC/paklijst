import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TripsListPage } from './features/trips/TripsListPage';
import { TripCompositorPage } from './features/trips/TripCompositorPage';
import { TripDetailPage } from './features/trips/TripDetailPage';
import { LibraryPage } from './features/library/LibraryPage';
import { ProfilePage } from './features/profile/ProfilePage';

export const router = createBrowserRouter([
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
