import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute, { TeacherRoute, UnauthRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Profile from './pages/Profile'
import TeacherExercisesList from './pages/teacher/ExercisesList'
import TeacherExerciseForm from './pages/teacher/ExerciseForm'
import TeacherQuizCreate from './pages/teacher/QuizCreate'
import TeacherMyQuizzes from './pages/teacher/MyQuizzes'
import UploadCsvPage from './pages/teacher/UploadCsv'
import TeacherPortal from './pages/teacher/Portal'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<UnauthRoute><Login /></UnauthRoute>} />
          <Route path="/register" element={<UnauthRoute><Register /></UnauthRoute>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercises"
            element={
              <ProtectedRoute>
                <Exercises />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/portal"
            element={
              <TeacherRoute>
                <TeacherPortal />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/exercises"
            element={
              <TeacherRoute>
                <TeacherExercisesList />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/quizzes"
            element={
              <TeacherRoute>
                <TeacherMyQuizzes />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/quizzes/new"
            element={
              <TeacherRoute>
                <TeacherQuizCreate />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/upload-csv"
            element={
              <TeacherRoute>
                <UploadCsvPage />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/exercises/new"
            element={
              <TeacherRoute>
                <TeacherExerciseForm mode="create" />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/exercises/:id/edit"
            element={
              <TeacherRoute>
                <TeacherExerciseForm mode="edit" />
              </TeacherRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
