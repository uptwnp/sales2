import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  Plus,
  Share2,
  CheckCircle,
  XCircle,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Lead, Todo } from '../../types';
import Badge from '../ui/Badge';
import AddTodoModal from '../todos/AddTodoModal';
import AddActivityModal from '../todos/AddActivityModal';
import TodoViewModal from '../todos/TodoViewModal';
import TodoActionModal from '../todos/TodoActionModal';
import { format } from 'date-fns';
import Dropdown from '../common/Dropdown';
import TagInput from '../common/TagInput';
import { dropdownOptions, tagOptions } from '../../data/options';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const leadId = id ? parseInt(id) : 0;
  const navigate = useNavigate();

  const { getLeadById, getTodosByLeadId, updateLead, setActiveLeadId, fetchSingleLead } =
    useAppContext();

  const lead = getLeadById(leadId);
  const todos = getTodosByLeadId(leadId);

  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    'complete' | 'cancel' | 'reschedule' | 'reopen'
  >('complete');

  const [collapsedSections, setCollapsedSections] = useState(() => {
    const savedState = localStorage.getItem('collapsedSections');
    return savedState ? JSON.parse(savedState) : {};
  });

  const toggleSection = (section: string) => {
    const newState = {
      ...collapsedSections,
      [section]: !collapsedSections[section],
    };
    setCollapsedSections(newState);
    localStorage.setItem('collapsedSections', JSON.stringify(newState));
  };

  // Fetch lead if not found in current state
  useEffect(() => {
    if (leadId && !lead) {
      fetchSingleLead(leadId);
    }
  }, [leadId, lead, fetchSingleLead]);

  useEffect(() => {
    if (lead) {
      // If we are editing the same lead, only update the timestamp
      // to prevent overwriting local changes.
      if (editedLead && editedLead.id === lead.id) {
        if (editedLead.updatedAt !== lead.updatedAt) {
          setEditedLead((prev) => ({ ...prev!, updatedAt: lead.updatedAt }));
        }
      } else {
        // This is for initial load or for a new lead
        setEditedLead(lead);
      }
    }
  }, [lead, editedLead]);

  useEffect(() => {
    if (leadId) {
      setActiveLeadId(leadId);
    }
    return () => {
      setActiveLeadId(null);
    };
  }, [leadId, setActiveLeadId]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!lead || !editedLead) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Lead not found
          </h2>
          <button
            className="mt-4 btn btn-primary"
            onClick={() => navigate('/leads')}
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof Lead, value: any) => {
    setEditedLead((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleInputBlur = (field: keyof Lead, value: any) => {
    const updatedValue = value?.trim?.() !== '' ? value : null;
    updateLead(leadId, { [field]: updatedValue });
  };

  const handleImmediateChange = (field: keyof Lead, value: any) => {
    const updatedValue = value?.trim?.() !== '' ? value : null;
    setEditedLead((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: updatedValue };
    });
    updateLead(leadId, { [field]: updatedValue });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, h:mm a');
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsViewModalOpen(true);
  };

  const handleTodoAction = (
    todo: Todo,
    action: 'complete' | 'cancel' | 'reschedule' | 'reopen'
  ) => {
    setSelectedTodo(todo);
    setActionType(action);
    setIsActionModalOpen(true);
  };

  const pendingTodos = todos.filter((todo) => todo.status === 'Pending');
  const completedTodos = todos.filter((todo) => todo.status !== 'Pending');

  const renderSectionHeader = (title: string, section: string) => (
    <div
      className="flex items-center justify-between cursor-pointer p-4 py-2"
      onClick={() => toggleSection(section)}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {collapsedSections[section] ? (
        <ChevronDown size={20} className="text-gray-500" />
      ) : (
        <ChevronUp size={20} className="text-gray-500" />
      )}
    </div>
  );

  return (
    <div className="p-2 md:p-4 pt-6 sm:p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="w-full mb-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  #{editedLead.id} {editedLead.name} - {editedLead.budget} Lakh
                </h2>
              </div>

              <button
                onClick={() => window.history.back()}
                className="btn btn-ghost p-2"
                title="Go Back"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <span>{editedLead.address}</span>
              <span> - {editedLead.about}</span>-{' '}
              <span>{formatDateTime(editedLead.updatedAt)}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <a href={`tel:${editedLead.phone}`} className="btn btn-outline">
                <Phone size={18} />
              </a>
              <a
                href={`https://wa.me/${editedLead.phone}`}
                className="btn btn-success"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare size={18} />
              </a>
              <button
                className="btn btn-primary"
                onClick={() => setIsAddTodoModalOpen(true)}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Todo</span>
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setIsAddActivityModalOpen(true)}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Activity</span>
              </button>
              <button className="btn btn-outline">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="block bg-white p-2">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage
              </label>
              <Dropdown
                options={dropdownOptions.stage}
                value={editedLead.stage}
                onChange={(value) => handleImmediateChange('stage', value)}
                placeholder="Select stage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Dropdown
                options={dropdownOptions.priority}
                value={editedLead.priority}
                onChange={(value) => handleImmediateChange('priority', value)}
                placeholder="Select priority"
              />
            </div>
          </div>

          {pendingTodos.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              {renderSectionHeader('Pending Tasks', 'pending')}
              {!collapsedSections['pending'] && (
                <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                  {pendingTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleTodoClick(todo)}
                      >
                        <h3 className="font-medium">
                          #{todo.id} - {todo.type}
                        </h3>
                        {todo.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {todo.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(todo.dateTime)} {todo.responseNote && <span>({todo.responseNote})</span>}
                        </p>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          className="p-1 text-gray-600 hover:text-green-600 rounded-full hover:bg-green-50"
                          onClick={() => handleTodoAction(todo, 'complete')}
                          title="Complete task"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
                          onClick={() => handleTodoAction(todo, 'cancel')}
                          title="Cancel task"
                        >
                          <XCircle size={18} />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                          onClick={() => handleTodoAction(todo, 'reschedule')}
                          title="Reschedule task"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            {renderSectionHeader('Property Requirements', 'requirements')}
            {!collapsedSections['requirements'] && (
              <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <TagInput
                      options={tagOptions.propertyType}
                      value={editedLead.propertyType ?? []}
                      onChange={(value) =>
                        handleImmediateChange('propertyType', value)
                      }
                      placeholder="Add property types"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget (in Lakhs)
                    </label>
                    <input
                      type="number"
                      value={editedLead.budget}
                      onChange={(e) =>
                        handleInputChange('budget', parseFloat(e.target.value))
                      }
                      onBlur={(e) =>
                        handleInputBlur('budget', parseFloat(e.target.value))
                      }
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement Description
                  </label>
                  <textarea
                    value={editedLead.requirementDescription || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'requirementDescription',
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      handleInputBlur('requirementDescription', e.target.value)
                    }
                    className="input h-24"
                    placeholder="Enter requirement details"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Location
                  </label>
                  <TagInput
                    options={tagOptions.preferredLocation}
                    value={editedLead.preferredLocation ?? []}
                    onChange={(value) =>
                      handleImmediateChange('preferredLocation', value)
                    }
                    placeholder="Add locations"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Size
                    </label>
                    <TagInput
                      options={tagOptions.preferredSize}
                      value={editedLead.preferredSize ?? []}
                      onChange={(value) =>
                        handleImmediateChange('preferredSize', value)
                      }
                      placeholder="Add sizes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <Dropdown
                      options={dropdownOptions.purpose}
                      value={editedLead.purpose}
                      onChange={(value) =>
                        handleImmediateChange('purpose', value)
                      }
                      placeholder="Select purpose"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Timeline
                    </label>
                    <Dropdown
                      options={dropdownOptions.purchaseTimeline}
                      value={editedLead.purchaseTimeline}
                      onChange={(value) =>
                        handleImmediateChange('purchaseTimeline', value)
                      }
                      placeholder="Select timeline"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interested In
                    </label>
                    <input
                      type="text"
                      value={editedLead.interestedIn || ''}
                      onChange={(e) =>
                        handleInputChange('interestedIn', e.target.value)
                      }
                      onBlur={(e) =>
                        handleInputBlur('interestedIn', e.target.value)
                      }
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow">
            {renderSectionHeader('Contact Information', 'contact')}
            {!collapsedSections['contact'] && (
              <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editedLead.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      onBlur={(e) => handleInputBlur('name', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editedLead.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      onBlur={(e) => handleInputBlur('phone', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternate Contact
                    </label>
                    <input
                      type="text"
                      value={editedLead.alternatePhone || ''}
                      onChange={(e) =>
                        handleInputChange('alternatePhone', e.target.value)
                      }
                      onBlur={(e) =>
                        handleInputBlur('alternatePhone', e.target.value)
                      }
                      className="input"
                      placeholder="Additional contact details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editedLead.address || ''}
                      onChange={(e) =>
                        handleInputChange('address', e.target.value)
                      }
                      onBlur={(e) => handleInputBlur('address', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About Person
                    </label>
                    <input
                      type="text"
                      value={editedLead.about || ''}
                      onChange={(e) =>
                        handleInputChange('about', e.target.value)
                      }
                      onBlur={(e) => handleInputBlur('about', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {completedTodos.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              {renderSectionHeader('Task History', 'history')}
              {!collapsedSections['history'] && (
                <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleTodoClick(todo)}
                      >
                        <h3 className="font-medium">
                          #{todo.id} - {todo.type} <Badge label={todo.type} color="blue" />
                        </h3>
                        {todo.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {todo.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(todo.dateTime)}{' '}
                          <Badge
                            label={todo.status}
                            color={
                              todo.status === 'Completed' ? 'green' : 'red'
                            }
                          />
                        </p>
                        {todo.responseNote && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Response:</strong> {todo.responseNote}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                          onClick={() => handleTodoAction(todo, 'reopen')}
                          title="Reopen task"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            {renderSectionHeader('Lead Status', 'status')}
            {!collapsedSections['status'] && (
              <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <TagInput
                    options={tagOptions.tags}
                    value={editedLead.tags ?? []}
                    onChange={(value) => handleImmediateChange('tags', value)}
                    placeholder="Add tags"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Segment
                  </label>
                  <Dropdown
                    options={dropdownOptions.segment}
                    value={editedLead.segment}
                    onChange={(value) =>
                      handleImmediateChange('segment', value)
                    }
                    placeholder="Select segment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={editedLead.note || ''}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    onBlur={(e) => handleInputBlur('note', e.target.value)}
                    className="input h-24"
                    placeholder="Enter general notes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Not Interested In
                  </label>
                  <input
                    type="text"
                    value={editedLead.notInterestedIn || ''}
                    onChange={(e) =>
                      handleInputChange('notInterestedIn', e.target.value)
                    }
                    onBlur={(e) =>
                      handleInputBlur('notInterestedIn', e.target.value)
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intent
                  </label>
                  <Dropdown
                    options={dropdownOptions.intent}
                    value={editedLead.intent}
                    onChange={(value) => handleImmediateChange('intent', value)}
                    placeholder="Select Intent"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow">
            {renderSectionHeader('Source Information', 'source')}
            {!collapsedSections['source'] && (
              <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <Dropdown
                    options={dropdownOptions.source}
                    value={editedLead.source}
                    onChange={(value) => handleImmediateChange('source', value)}
                    placeholder="Select source"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <TagInput
                    options={tagOptions.assignedTo}
                    value={editedLead.assignedTo ?? []}
                    onChange={(value) =>
                      handleImmediateChange('assignedTo', value)
                    }
                    placeholder="Assign team members"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    List Name
                  </label>
                  <input
                    type="text"
                    value={editedLead.listName || ''}
                    onChange={(e) =>
                      handleInputChange('listName', e.target.value)
                    }
                    onBlur={(e) => handleInputBlur('listName', e.target.value)}
                    className="input"
                    placeholder="Enter list name"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow">
            {renderSectionHeader('Additional Data', 'additional')}
            {!collapsedSections['additional'] && (
              <div className="p-2 md:p-4 space-y-4 transition-all duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medium
                  </label>
                  <Dropdown
                    options={dropdownOptions.medium}
                    value={editedLead.medium || ''}
                    onChange={(value) => handleImmediateChange('medium', value)}
                    placeholder="Select medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placement
                  </label>
                  <Dropdown
                    options={dropdownOptions.placement}
                    value={editedLead.placement || ''}
                    onChange={(value) =>
                      handleImmediateChange('placement', value)
                    }
                    placeholder="Select placement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data 1
                  </label>
                  <input
                    type="text"
                    value={editedLead.data1 || ''}
                    onChange={(e) => handleInputChange('data1', e.target.value)}
                    onBlur={(e) => handleInputBlur('data1', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data 2
                  </label>
                  <input
                    type="text"
                    value={editedLead.data2 || ''}
                    onChange={(e) => handleInputChange('data2', e.target.value)}
                    onBlur={(e) => handleInputBlur('data2', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data 3
                  </label>
                  <input
                    type="text"
                    value={editedLead.data3 || ''}
                    onChange={(e) => handleInputChange('data3', e.target.value)}
                    onBlur={(e) => handleInputBlur('data3', e.target.value)}
                    className="input"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <span>Created: {formatDateTime(editedLead.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>Updated: {formatDateTime(editedLead.updatedAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTodoModal
        isOpen={isAddTodoModalOpen}
        onClose={() => setIsAddTodoModalOpen(false)}
        leadId={leadId}
        defaultType="Follow Up"
      />

      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        leadId={leadId}
      />

      {selectedTodo && (
        <>
          <TodoViewModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedTodo(null);
            }}
            todo={selectedTodo}
          />
          <TodoActionModal
            isOpen={isActionModalOpen}
            onClose={() => {
              setIsActionModalOpen(false);
              setSelectedTodo(null);
            }}
            todo={selectedTodo}
            actionType={actionType}
          />
        </>
      )}
    </div>
  );
};

export default LeadDetail;
