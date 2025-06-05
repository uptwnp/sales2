import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { useAppContext } from '../../contexts/AppContext';
import { Todo, DropdownOption } from '../../types';
import { dropdownOptions, tagOptions } from '../../data/options';
import Dropdown from '../common/Dropdown';
import TagInput from '../common/TagInput';

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: number;
  defaultType?: Todo['type'];
}

const AddTodoModal: React.FC<AddTodoModalProps> = ({ 
  isOpen, 
  onClose, 
  leadId,
  defaultType
}) => {
  const { addTodo, leads } = useAppContext();
  const navigate = useNavigate();
  
  const initialTodoState: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> = {
    leadId: leadId || 0,
    type: defaultType || 'Follow Up',
    title: '',
    description: '',
    responseNote: '',
    status: 'Pending',
    dateTime: new Date().toISOString(),
    participants: [],
  };

  const [formData, setFormData] = useState(initialTodoState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTagChange = (name: string, value: string[]) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const currentDateTime = new Date(formData.dateTime);
    const [year, month, day] = value.split('-').map(Number);
    
    currentDateTime.setFullYear(year);
    currentDateTime.setMonth(month - 1);
    currentDateTime.setDate(day);
    
    setFormData({ ...formData, dateTime: currentDateTime.toISOString() });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const currentDateTime = new Date(formData.dateTime);
    const [hours, minutes] = value.split(':').map(Number);
    
    currentDateTime.setHours(hours);
    currentDateTime.setMinutes(minutes);
    
    setFormData({ ...formData, dateTime: currentDateTime.toISOString() });
  };

  const handleSubmit = async () => {
    await addTodo(formData);
    
    if (!leadId && formData.leadId) {
      navigate(`/leads/${formData.leadId}`);
    }
    
    setFormData(initialTodoState);
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.leadId !== 0 &&
      formData.title.trim() !== ''
    );
  };

  const currentDate = new Date(formData.dateTime);
  const dateValue = currentDate.toISOString().split('T')[0];
  const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  const leadOptions: DropdownOption[] = leads.map(lead => ({
    value: lead.id.toString(),
    label: `${lead.id}. ${lead.name}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Task"
      size="md"
    >
      <div className="space-y-4">
        {!leadId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Connected Lead *</label>
            <Dropdown
              options={leadOptions}
              value={formData.leadId.toString()}
              onChange={(value) => setFormData({ ...formData, leadId: parseInt(value) })}
              placeholder="Select a lead"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Type *</label>
          <Dropdown
            options={dropdownOptions.todoType}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as Todo['type'] })}
            placeholder="Select task type"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="input"
            placeholder="Enter task title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="input h-24"
            placeholder="Enter task description"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="input"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
          <TagInput
            options={tagOptions.participants}
            value={formData.participants}
            onChange={(value) => handleTagChange('participants', value)}
            placeholder="Add participants"
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!isFormValid()}
        >
          Add Task
        </button>
      </div>
    </Modal>
  );
};

export default AddTodoModal;