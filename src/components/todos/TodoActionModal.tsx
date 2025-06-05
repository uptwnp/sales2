import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../contexts/AppContext';
import { Todo } from '../../types';
import { format } from 'date-fns';

interface TodoActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo;
  actionType: 'complete' | 'cancel' | 'reschedule' | 'reopen';
}

const TodoActionModal: React.FC<TodoActionModalProps> = ({ 
  isOpen, 
  onClose, 
  todo, 
  actionType 
}) => {
  const { updateTodo } = useAppContext();
  const [responseNote, setResponseNote] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<string>(
    new Date(todo.dateTime).toISOString().split('T')[0]
  );
  const [rescheduleTime, setRescheduleTime] = useState<string>(
    format(new Date(todo.dateTime), 'HH:mm')
  );

  const handleComplete = () => {
    updateTodo(todo.id, {
      status: 'Completed',
      responseNote,
    });
    onClose();
  };

  const handleCancel = () => {
    updateTodo(todo.id, {
      status: 'Cancelled',
      responseNote,
    });
    onClose();
  };

  const handleReschedule = () => {
    const newDate = new Date(`${rescheduleDate}T${rescheduleTime}`);
    
    updateTodo(todo.id, {
      dateTime: newDate.toISOString(),
      responseNote,
      status: 'Pending',
    });
    onClose();
  };

  const handleReopen = () => {
    updateTodo(todo.id, {
      status: 'Pending',
      responseNote,
    });
    onClose();
  };

  const modalTitle = 
    actionType === 'complete' ? 'Complete Task' :
    actionType === 'cancel' ? 'Cancel Task' :
    actionType === 'reopen' ? 'Reopen Task' :
    'Reschedule Task';

  const buttonText = 
    actionType === 'complete' ? 'Mark as Complete' :
    actionType === 'cancel' ? 'Cancel Task' :
    actionType === 'reopen' ? 'Reopen Task' :
    'Reschedule';

  const buttonClass = 
    actionType === 'complete' ? 'btn-success' :
    actionType === 'cancel' ? 'btn-danger' :
    actionType === 'reopen' ? 'btn-primary' :
    'btn-primary';

  const handleAction = () => {
    if (actionType === 'complete') {
      handleComplete();
    } else if (actionType === 'cancel') {
      handleCancel();
    } else if (actionType === 'reopen') {
      handleReopen();
    } else {
      handleReschedule();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">{todo.title}</h3>
          {todo.description && <p className="text-sm text-gray-600 mt-1">{todo.description}</p>}
          <p className="text-sm text-gray-500 mt-2">
            Scheduled for {format(new Date(todo.dateTime), 'PPp')}
          </p>
        </div>
        
        {actionType === 'reschedule' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {actionType === 'reschedule' ? 'Reschedule Reason' : 
             actionType === 'reopen' ? 'Reopen Reason' :
             'Response Note'}
          </label>
          <textarea
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            className="input h-24"
            placeholder={
              actionType === 'complete' ? 'Add details about task completion...' :
              actionType === 'cancel' ? 'Add reason for cancellation...' :
              actionType === 'reopen' ? 'Add reason for reopening...' :
              'Add reason for rescheduling...'
            }
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-6 space-x-3">
        <button 
          type="button"
          className="btn btn-outline"
          onClick={onClose}
        >
          Cancel
        </button>
        <button 
          type="button"
          className={`btn ${buttonClass}`}
          onClick={handleAction}
          disabled={actionType === 'reschedule' && (!rescheduleDate || !rescheduleTime)}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
};

export default TodoActionModal;