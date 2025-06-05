import React, { useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import TodosList from './TodosList';

const Activities: React.FC = () => {
  const { fetchTodos } = useAppContext();

  useEffect(() => {
    // Fetch only activities
    fetchTodos({
      type: 'Activity'
    });
  }, []);

  return (
    <TodosList 
      defaultType="Activity"
      title="Activities"
      showAddButton={false}
      isActivityView={true}
    />
  );
};

export default Activities;