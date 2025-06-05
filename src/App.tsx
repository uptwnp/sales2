import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout/Layout';
import LeadsList from './components/leads/LeadsList';
import LeadDetail from './components/leads/LeadDetail';
import TodosList from './components/todos/TodosList';
import FollowUps from './components/todos/FollowUps';
import Meetings from './components/todos/Meetings';
import Activities from './components/todos/Activities';
import Calendar from './components/calendar/Calendar';
import PinLogin from './components/auth/PinLogin';
import PrivateRoute from './components/auth/PrivateRoute';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<PinLogin />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/leads\" replace />} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="tasks" element={<TodosList />} />
          <Route
            path="follow-ups"
            element={<TodosList defaultType="Follow Up\" title="Follow Ups" />}
          />
          <Route
            path="meetings"
            element={<TodosList defaultType="Meeting\" title="My Meetings" />}
          />
          <Route
            path="find-match"
            element={<TodosList defaultType="Find Match\" title="Find Match" />}
          />
          <Route
            path="to-schedule-visit"
            element={
              <TodosList
                defaultType="Schedule Site Visit"
                title="Site Visits"
              />
            }
          />
          <Route path="activities" element={<Activities />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="*" element={<Navigate to="/leads\" replace />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
      />
    </>
  );
};

export default App;