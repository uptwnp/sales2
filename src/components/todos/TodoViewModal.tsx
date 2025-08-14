import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { useAppContext } from '../../contexts/AppContext';
import { Todo } from '../../types';
import { format } from 'date-fns';
import Badge from '../ui/Badge';
import { dropdownOptions, tagOptions } from '../../data/options';
import Dropdown from '../common/Dropdown';
import TagInput from '../common/TagInput';
import QuickDateTimeInput from '../common/QuickDateTimeInput';

interface TodoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo | null;
}

const TodoViewModal: React.FC<TodoViewModalProps> = ({
  isOpen,
  onClose,
  todo,
}) => {
  const { getLeadById, updateTodo } = useAppContext();
  const navigate = useNavigate();

  const [editedTodo, setEditedTodo] = useState<Todo | null>(todo);
  const [isEditing, setIsEditing] = useState(false);

  // Update editedTodo when todo prop changes
  useEffect(() => {
    setEditedTodo(todo);
  }, [todo]);

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  // Don't render if todo is null
  if (!todo || !editedTodo) {
    return null;
  }

  const lead = getLeadById(editedTodo.leadId);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedTodo((prev) => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleDropdownChange = (name: string, value: string) => {
    setEditedTodo((prev) => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleTagChange = (name: string, value: string[]) => {
    setEditedTodo((prev) => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleDateChange = (value: string) => {
    if (!editedTodo) return;
    const currentDateTime = new Date(editedTodo.dateTime);
    const [year, month, day] = value.split('-').map(Number);
    currentDateTime.setFullYear(year);
    currentDateTime.setMonth(month - 1);
    currentDateTime.setDate(day);
    setEditedTodo((prev) => prev ? ({
      ...prev,
      dateTime: currentDateTime.toISOString(),
    }) : null);
  };

  const handleTimeChange = (value: string) => {
    if (!editedTodo) return;
    const currentDateTime = new Date(editedTodo.dateTime);
    const [hours, minutes] = value.split(':').map(Number);
    currentDateTime.setHours(hours);
    currentDateTime.setMinutes(minutes);
    setEditedTodo((prev) => prev ? ({
      ...prev,
      dateTime: currentDateTime.toISOString(),
    }) : null);
  };

  const handleSave = () => {
    if (editedTodo) {
      updateTodo(todo.id, editedTodo);
      setIsEditing(false);
    }
  };

  const handleStatusChange = (
    newStatus: 'Completed' | 'Cancelled' | 'Pending'
  ) => {
    if (!editedTodo) return;
    
    const updatedTodo = {
      ...editedTodo,
      status: newStatus,
    };
    updateTodo(todo.id, updatedTodo);
    setEditedTodo(updatedTodo);
  };

  const currentDate = new Date(editedTodo.dateTime);
  const dateValue = currentDate.toISOString().split('T')[0];
  const timeValue = `${String(currentDate.getHours()).padStart(
    2,
    '0'
  )}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? 'Edit ' + '#'+ editedTodo.id
          : +editedTodo.id + ' - ' + editedTodo.type + ' Details'
      }
      size="lg"
    >
      <div className="space-y-4">
        <div>
        <div className="items-center justify-between">
  <div className="items-center space-x-2">
    {isEditing ? (
      <Dropdown
        options={dropdownOptions.todoType}
        value={editedTodo.type}
        onChange={(value) => handleDropdownChange('type', value)}
        placeholder="Select type"
      />
    ) : null}
  </div>
</div>


          {isEditing ? (
            <>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editedTodo.description}
                  onChange={handleInputChange}
                  className="input h-24"
                />
              </div>
            </>
          ) : (
            <>
              {editedTodo.description && (
                <p className="text-gray-600 mt-0 mb-4">
                  {editedTodo.description}
                </p>
              )}
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={() => {
                  navigate(`/leads/${editedTodo.leadId}`);
                  onClose();
                }}
              >
                {editedTodo.leadId}. {lead?.name} &{' '}
                {editedTodo.participants.map((participant, idx) => (
                  <Badge key={idx} label={participant} color="gray" small />
                ))}
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isEditing ? (
            <>
              <div>
                <QuickDateTimeInput
                  type="date"
                  label="Date"
                  value={dateValue}
                  onChange={handleDateChange}
                />
              </div>
              <div>
                <QuickDateTimeInput
                  type="time"
                  label="Time"
                  value={timeValue}
                  onChange={handleTimeChange}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date & Time
              </label>
              <p className="mt-1">
                {format(new Date(editedTodo.dateTime), 'PPp')}
              </p>
            </div>
          )}
        </div>
        <div>
          {isEditing && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participants
              </label>
              <TagInput
                options={tagOptions.participants}
                value={editedTodo.participants}
                onChange={(value) => handleTagChange('participants', value)}
                placeholder="Add participants"
              />
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Response
          </label>
          {isEditing || editedTodo.status === 'Pending' ? (
            <textarea
              name="responseNote"
              value={editedTodo.responseNote}
              onChange={handleInputChange}
              className="input h-24"
              placeholder="Enter response or notes..."
            />
          ) : (
            <p className="mt-1 text-gray-600">
              {editedTodo.responseNote || 'No response provided'}
            </p>
          )}
        </div>
        {!isEditing && (
          <div className="flex space-x-2">
            <div className="flex-1">
              <button
                className="btn btn-outline py-1 px-2"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            </div>
            {editedTodo.status === 'Pending' ? (
              <>
                <button
                  className="btn btn-success py-1 px-2"
                  onClick={() => handleStatusChange('Completed')}
                >
                  Complete
                </button>
                <button
                  className="btn btn-danger py-1 px-2"
                  onClick={() => handleStatusChange('Cancelled')}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline py-1 px-2"
                onClick={() => handleStatusChange('Pending')}
              >
                Reopen
              </button>
            )}
          </div>
        )}
        {isEditing && (
          <div className="flex justify-end space-x-3">
            <button
              className="btn btn-outline"
              onClick={() => {
                setEditedTodo(todo);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TodoViewModal;
