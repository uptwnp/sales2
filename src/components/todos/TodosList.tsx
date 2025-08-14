import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { 
  Plus, 
  Filter, 
  Calendar, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Loader2,
  X,
  Trash2
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { Todo, TodoType } from '../../types';
import Badge from '../ui/Badge';
import LoadingIndicator from '../ui/LoadingIndicator';
import AddTodoModal from './AddTodoModal';
import TodoViewModal from './TodoViewModal';
import TodoActionModal from './TodoActionModal';
import TodoFilterModal from './TodoFilterModal';

interface TodosListProps {
  defaultType?: TodoType;
  title?: string;
  showAddButton?: boolean;
  isActivityView?: boolean;
}

const ITEMS_PER_PAGE = 10;

const TodosList: React.FC<TodosListProps> = ({
  defaultType,
  title = 'Tasks',
  showAddButton = true,
  isActivityView = false,
}) => {
  const {
    getFilteredTodos,
    getLeadById,
    todoFilters,
    clearTodoFilters,
    removeTodoFilter,
    deleteTodo,
    fetchTodos,
    fetchSingleLead,
  } = useAppContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    'complete' | 'cancel' | 'reschedule' | 'reopen'
  >('complete');
  const [fetchingLeads, setFetchingLeads] = useState<Set<number>>(new Set());
  const [failedLeads, setFailedLeads] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  // Use persistent state for todos section with a unique key based on the type
  const stateKey = `todos_${defaultType || 'all'}`;
  const { state, updateState, clearFilters, clearSearch, clearAll, isStatePersisted } = usePersistentState(stateKey);
  const { currentPage, searchQuery, activeTab = 'today', filters: savedFilters } = state;

  // Get todos directly from context
  const contextTodos = getFilteredTodos();
  const allTodos = contextTodos;
  const hasInitialData = React.useRef(false);

  // Fetch todos when component mounts
  useEffect(() => {
    const params = {
      type: defaultType,
      page: currentPage,
      perPage: ITEMS_PER_PAGE,
      sortOrder: 'desc' as const,
    };

    // Always fetch data on first mount
    if (!hasInitialData.current) {
      fetchTodos(params);
      hasInitialData.current = true;
    }
  }, [defaultType, currentPage, fetchTodos]);

  // Fetch todos when defaultType changes
  useEffect(() => {
    if (defaultType && hasInitialData.current) {
      const params = {
        type: defaultType,
        page: 1,
        perPage: ITEMS_PER_PAGE,
        sortOrder: 'desc' as const,
      };
      fetchTodos(params);
      updateState({ currentPage: 1 });
    }
  }, [defaultType, fetchTodos, updateState]);

  // Don't show empty state if we're still loading or haven't fetched data yet
  const shouldShowEmptyState = hasInitialData.current && allTodos?.length === 0;

  const filteredTodos = (allTodos || []).filter((todo) => {
    // For activity view, only show activities
    if (isActivityView && todo.type !== 'Activity') {
      return false;
    }

    // For non-activity views, exclude activities
    if (!isActivityView && todo.type === 'Activity') {
      return false;
    }

    const searchTerm = searchQuery || '';
    const matchesSearch =
      
      (todo.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getLeadById(todo.leadId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const todoDate = new Date(todo.dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'today':
        return isToday(todoDate) && todo.status !== 'Completed';
      case 'upcoming':
        return isFuture(todoDate) && !isToday(todoDate) && todo.status !== 'Completed';
      case 'overdue':
        return isPast(todoDate) && !isToday(todoDate) && todo.status !== 'Completed';
      case 'all':
        return todo.status !== 'Completed';
      case 'completed':
        return todo.status === 'Completed';
      default:
        return todo.status !== 'Completed';
    }
  });

  const getTodosByTab = () => {
    return filteredTodos;
  };

  const getPaginatedTodos = () => {
    const todos = getTodosByTab();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return todos.slice(startIndex, endIndex);
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({
      searchQuery: e.target.value,
      currentPage: 1
    });
  }, [updateState]);

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    updateState({ activeTab: tab, currentPage: 1 });
  }, [updateState]);

  const handlePageChange = useCallback((newPage: number) => {
    updateState({ currentPage: newPage });
  }, [updateState]);

  const handleTodoClick = useCallback((todo: Todo) => {
    setSelectedTodo(todo);
    setIsViewModalOpen(true);
  }, []);

  const handleTodoAction = useCallback((
    todo: Todo,
    action: 'complete' | 'cancel' | 'reschedule' | 'reopen'
  ) => {
    setSelectedTodo(todo);
    setActionType(action);
    setIsActionModalOpen(true);
  }, []);

  const handleDeleteTodo = useCallback((todoId: number) => {
    deleteTodo(todoId);
  }, [deleteTodo]);

  const handleLeadClick = useCallback((leadId: number) => {
    navigate(`/leads/${leadId}`);
  }, [navigate]);

  const handleClearFilters = useCallback(() => {
    clearTodoFilters();
    clearFilters();
  }, [clearTodoFilters, clearFilters]);

  const handleClearSearch = useCallback(() => {
    updateState({ searchQuery: '', currentPage: 1 });
  }, [updateState]);

  const handleClearAll = useCallback(() => {
    clearTodoFilters();
    clearAll();
  }, [clearTodoFilters, clearAll]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const getLeadName = (leadId: number) => {
    const lead = getLeadById(leadId);
    
    if (lead) {
      return lead.name;
    }
    
    // If lead failed to fetch, show error message
    if (failedLeads.has(leadId)) {
      return 'Lead Not Found';
    }
    
    // If lead is not found and we're not already fetching it, fetch it
    if (!fetchingLeads.has(leadId)) {
      setFetchingLeads(prev => new Set(prev).add(leadId));
      fetchSingleLead(leadId)
        .then((fetchedLead) => {
          if (!fetchedLead) {
            console.warn(`Lead with ID ${leadId} not found`);
            setFailedLeads(prev => new Set(prev).add(leadId));
          }
        })
        .catch((error) => {
          console.error(`Error fetching lead ${leadId}:`, error);
          setFailedLeads(prev => new Set(prev).add(leadId));
        })
        .finally(() => {
          setFetchingLeads(prev => {
            const newSet = new Set(prev);
            newSet.delete(leadId);
            return newSet;
          });
        });
    }
    
    return 'Loading...';
  };

  const getLeadBudget = (leadId: number) => {
    const lead = getLeadById(leadId);
    
    if (lead) {
      return lead.budget;
    }
    
    // If lead failed to fetch, show error message
    if (failedLeads.has(leadId)) {
      return 'N/A';
    }
    
    // If lead is not found and we're not already fetching it, fetch it
    if (!fetchingLeads.has(leadId)) {
      setFetchingLeads(prev => new Set(prev).add(leadId));
      fetchSingleLead(leadId)
        .then((fetchedLead) => {
          if (!fetchedLead) {
            console.warn(`Lead with ID ${leadId} not found`);
            setFailedLeads(prev => new Set(prev).add(leadId));
          }
        })
        .catch((error) => {
          console.error(`Error fetching lead ${leadId}:`, error);
          setFailedLeads(prev => new Set(prev).add(leadId));
        })
        .finally(() => {
          setFetchingLeads(prev => {
            const newSet = new Set(prev);
            newSet.delete(leadId);
            return newSet;
          });
        });
    }
    
    return '...';
  };

  // Only show loading on initial load
  const showLoading = !hasInitialData.current;

  const paginatedTodos = getPaginatedTodos();
  const totalTodos = getTodosByTab().length;
  const totalPages = Math.ceil(totalTodos / ITEMS_PER_PAGE);

  // Ensure we always have a valid array to work with
  const safePaginatedTodos = paginatedTodos || [];

  // Show loading state if we're still fetching initial data
  if (showLoading) {
    return (
      <div className="p-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto scrollbar-hide min-w-0 flex-1 md:flex-none">
              {['today', 'upcoming', 'overdue', 'all', 'completed'].map((tab) => (
                <button
                  key={tab}
                  disabled
                  className="px-3 py-1 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed whitespace-nowrap flex-shrink-0"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex mt-4 md:mt-0 space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                className="input pr-10"
                disabled
              />
            </div>
            <button
              className="btn btn-outline flex items-center"
              disabled
            >
              <Filter size={16} />
            </button>
            {showAddButton && (
              <button
                className="btn btn-primary"
                disabled
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-12 text-center">
            <LoadingIndicator type="spinner" size="lg" text="Loading tasks..." />
            <p className="mt-4 text-gray-500 text-sm">Please wait while we fetch your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto scrollbar-hide min-w-0 flex-1 md:flex-none">
              {['today', 'upcoming', 'overdue', 'all', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab as typeof activeTab)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex mt-4 md:mt-0 space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                className="input pr-10"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <button
              className="btn btn-outline flex items-center"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <Filter size={16} />
            </button>
            {showAddButton && (
              <button
                className="btn btn-primary"
                onClick={() => setIsAddTodoModalOpen(true)}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {todoFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
            <span className="text-sm font-medium text-gray-600">
              Active Filters:
            </span>
            {todoFilters.map((filter, index) => (
              <Badge
                key={index}
                label={`${filter.field}: ${filter.value}`}
                color="gray"
                onClose={() => removeTodoFilter(index)}
              />
            ))}
            <button
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
              onClick={handleClearFilters}
            >
              <X size={14} className="mr-1" />
              Clear Filters
            </button>
            <button
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
              onClick={handleClearAll}
            >
              <X size={14} className="mr-1" />
              Clear All
            </button>
          </div>
        )}

        {/* Background loading indicator */}
        {/* showBackgroundLoading is removed, so this block is removed */}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Task</th>
                  <th className="table-header">Lead</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shouldShowEmptyState ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchQuery
                        ? 'No tasks found matching your search criteria'
                        : 'No tasks found for this view.'}
                    </td>
                  </tr>
                ) : (
                  safePaginatedTodos.map((todo) => (
                    <tr
                      key={todo.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleTodoClick(todo)}
                    >
                      <td className="table-cell">
                        <div className="flex flex-col">
                          {todo.description && (
                            <span className="font-medium text-gray-900 truncate max-w-[300px]">
                              {todo.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeadClick(todo.leadId);
                          }}
                          className={`font-medium ${
                            failedLeads.has(todo.leadId) 
                              ? 'text-red-600 hover:text-red-800' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          {fetchingLeads.has(todo.leadId) ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-1 animate-spin" size={14} />
                              Loading...
                            </span>
                          ) : (
                            getLeadName(todo.leadId)
                          )}
                        </button>
                        <div className="text-sm text-gray-500">
                          Budget: {fetchingLeads.has(todo.leadId) ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-1 animate-spin" size={12} />
                              Loading...
                            </span>
                          ) : (
                            typeof getLeadBudget(todo.leadId) === 'number' ? `${getLeadBudget(todo.leadId)} Lakh` : getLeadBudget(todo.leadId)
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge
                          label={todo.type}
                          color={
                            todo.type === 'Follow Up' ? 'blue' :
                            todo.type === 'Meeting' ? 'green' :
                            todo.type === 'Find Match' ? 'purple' :
                            todo.type === 'Schedule Site Visit' ? 'yellow' :
                            'gray'
                          }
                        />
                      </td>
                      <td className="table-cell">
                        <Badge
                          label={todo.status}
                          color={
                            todo.status === 'Completed' ? 'green' :
                            todo.status === 'Cancelled' ? 'red' :
                            todo.status === 'Overdue' ? 'orange' :
                            'gray'
                          }
                        />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDateTime(todo.dateTime)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                         
                          <button
                            className="p-1 text-gray-600 hover:text-green-600 rounded-full hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTodoAction(todo, 'complete');
                            }}
                            title="Complete"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTodoAction(todo, 'cancel');
                            }}
                            title="Cancel"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-orange-600 rounded-full hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTodoAction(todo, 'reschedule');
                            }}
                            title="Reschedule"
                          >
                            <RotateCcw size={16} />
                          </button>
                         
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 py-3 px-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalTodos} tasks)
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || showLoading}
                  className="btn btn-outline py-1 px-3 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || showLoading}
                  className="btn btn-outline py-1 px-3 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TodoFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <AddTodoModal
        isOpen={isAddTodoModalOpen}
        onClose={() => setIsAddTodoModalOpen(false)}
      />

      <TodoViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        todo={selectedTodo}
      />

      <TodoActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        todo={selectedTodo}
        actionType={actionType}
      />
    </>
  );
};

export default TodosList;