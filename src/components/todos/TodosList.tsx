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
import { useOptimizedDataFetching } from '../../hooks/useOptimizedDataFetching';
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

  // Use optimized data fetching with caching
  const {
    data: cachedTodos,
    isLoading: isDataLoading,
    isBackgroundLoading,
    fetchData,
    backgroundRefresh
  } = useOptimizedDataFetching<Todo[]>(
    async (params) => {
      await fetchTodos(params);
      return getFilteredTodos();
    },
    { ttl: 2 * 60 * 1000, maxSize: 20 } // 2 minutes cache
  );

  const allTodos = cachedTodos || getFilteredTodos();
  const hasInitialData = React.useRef(false);

  // Only fetch todos when component mounts or when defaultType changes
  useEffect(() => {
    const params = {
      type: defaultType,
      page: currentPage,
      perPage: ITEMS_PER_PAGE,
      sortOrder: 'desc',
    };

    if (!hasInitialData.current) {
      fetchData(params);
      hasInitialData.current = true;
    } else {
      backgroundRefresh(params);
    }
  }, [defaultType, currentPage, fetchData, backgroundRefresh]);

  // Fallback effect to ensure data is fetched if optimized fetching fails
  useEffect(() => {
    if (!hasInitialData.current && !allTodos?.length) {
      // If no data after a delay, try fetching directly
      const timer = setTimeout(() => {
        if (!allTodos?.length) {
          fetchTodos({
            type: defaultType,
            page: currentPage,
            perPage: ITEMS_PER_PAGE,
            sortOrder: 'desc',
          });
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [allTodos, hasInitialData, fetchTodos, defaultType, currentPage]);

  // Separate effect for when defaultType changes
  useEffect(() => {
    if (defaultType && hasInitialData.current) {
      const params = {
        type: defaultType,
        page: 1,
        perPage: ITEMS_PER_PAGE,
        sortOrder: 'desc',
      };
      fetchData(params);
      updateState({ currentPage: 1 });
    }
  }, [defaultType, fetchData, updateState]);

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
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getLeadById(todo.leadId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const todoDate = new Date(todo.dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'today':
        return isToday(todoDate);
      case 'upcoming':
        return isFuture(todoDate) && !isToday(todoDate);
      case 'overdue':
        return isPast(todoDate) && !isToday(todoDate);
      case 'all':
        return true;
      default:
        return true;
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

  // Only show loading on initial load, not on background refreshes
  const showLoading = isDataLoading && !hasInitialData.current;
  const showBackgroundLoading = isBackgroundLoading && hasInitialData.current;

  const paginatedTodos = getPaginatedTodos();
  const totalTodos = getTodosByTab().length;
  const totalPages = Math.ceil(totalTodos / ITEMS_PER_PAGE);

  // Ensure we always have a valid array to work with
  const safePaginatedTodos = paginatedTodos || [];

  // Debug logging
  console.log('TodosList Debug:', {
    defaultType,
    allTodosLength: allTodos?.length || 0,
    filteredTodosLength: filteredTodos.length,
    paginatedTodosLength: safePaginatedTodos.length,
    showLoading,
    showBackgroundLoading,
    hasInitialData: hasInitialData.current
  });

  return (
    <>
      <div className="p-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {['today', 'upcoming', 'overdue', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab as typeof activeTab)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
        {showBackgroundLoading && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-blue-700 text-sm">
              <LoadingIndicator type="spinner" size="sm" />
              <span className="ml-2">Refreshing tasks in background...</span>
            </div>
          </div>
        )}

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
                {showLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <LoadingIndicator type="spinner" size="md" text="Loading tasks..." />
                    </td>
                  </tr>
                ) : safePaginatedTodos.length === 0 ? (
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
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {todo.title}
                          </span>
                          {todo.description && (
                            <span className="text-sm text-gray-600 truncate max-w-[300px]">
                              {todo.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleLeadClick(todo.leadId)}
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
                            className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            onClick={() => handleTodoClick(todo)}
                            title="View Details"
                          >
                            <CalendarDays size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-green-600 rounded-full hover:bg-green-50"
                            onClick={() => handleTodoAction(todo, 'complete')}
                            title="Complete"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
                            onClick={() => handleTodoAction(todo, 'cancel')}
                            title="Cancel"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-orange-600 rounded-full hover:bg-orange-50"
                            onClick={() => handleTodoAction(todo, 'reschedule')}
                            title="Reschedule"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
                            onClick={() => handleDeleteTodo(todo.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
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