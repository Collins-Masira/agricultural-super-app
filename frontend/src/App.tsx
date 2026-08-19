import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import type { ReactElement } from 'react'
import { EmptyState, Button } from '@/components/ui'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AppLayout } from '@/features/layout/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { FeedPage } from '@/features/posts/pages/FeedPage'
import { CreatePostPage } from '@/features/posts/pages/CreatePostPage'
import { PostDetailPage } from '@/features/posts/pages/PostDetailPage'
import { ExpertsPage } from '@/features/experts/pages/ExpertsPage'
import { ExpertProfilePage } from '@/features/experts/pages/ExpertProfilePage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { EditProfilePage } from '@/features/profile/pages/EditProfilePage'

function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist."
      action={<Button to="/">Go to feed</Button>}
    />
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <FeedPage /> },
          { path: 'create', element: <CreatePostPage /> },
          { path: 'posts/:postId', element: <PostDetailPage /> },
          { path: 'experts', element: <ExpertsPage /> },
          { path: 'experts/:userId', element: <ExpertProfilePage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/edit', element: <EditProfilePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <PublicOnlyRoute element={<LoginPage />} />,
  },
  {
    path: '/register',
    element: <PublicOnlyRoute element={<RegisterPage />} />,
  },
])

/** Redirects already-authenticated users away from login/register. */
function PublicOnlyRoute({ element }: { element: ReactElement }) {
  const { status } = useAuth()
  if (status === 'loading') return <EmptyState title="Loading…" />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return element
}

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}