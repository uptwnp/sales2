import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  CalendarDays,
  X,
  CheckCircle,
  XCircle,
  Calendar,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import TodoFilterModal from './TodoFilterModal';
import AddTodoModal from './AddTodoModal';
import TodoViewModal from './TodoViewModal';
import TodoActionModal from './TodoActionModal';
import { Todo, TodoType } from '../../types';
import Badge from '../ui/Badge';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { usePersistentState } from '../../hooks/usePersistentState';

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
  } = useAppContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    'complete' | 'cancel' | 'reschedule' | 'reopen'
  >('complete');
  const navigate = useNavigate();

  // Use persistent state for todos section with a unique key based on the type
  const stateKey = `todos_${defaultType || 'all'}`;
  const { state, updateState } = usePersistentState(stateKey);
  const { currentPage, searchQuery, activeTab = 'today' } = state;

  // Fetch todos when component mounts or when defaultType changes
  useEffect(() => {
    fetchTodos({
      type: defaultType,
      page: currentPage,
      perPage: ITEMS_PER_PAGE,
      sortOrder: 'desc',
    });
  }, [defaultType, currentPage]);

  const allTodos = getFilteredTodos();

  const filteredTodos = allTodos.filter((todo) => {
    // For activity view, only show activities
    if (isActivityView && todo.type !== 'Activity') {
      return false;
    }

    // For non-activity views, exclude activities
    if (!isActivityView && todo.type === 'Activity') {
      return false;
    }

    const matchesSearch =
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getTodosByTab = () => {
    const pendingTodos = filteredTodos.filter(
      (todo) => todo.status === 'Pending'
    );
    const today = new Date();

    switch (activeTab) {
      case 'today':
        return pendingTodos.filter((todo) => isToday(new Date(todo.dateTime)));
      case 'upcoming':
        return pendingTodos.filter((todo) => {
          const todoDate = new Date(todo.dateTime);
          return isFuture(todoDate) && !isToday(todoDate);
        });
      case 'overdue':
        return pendingTodos.filter((todo) => {
          const todoDate = new Date(todo.dateTime);
          return isPast(todoDate) && !isToday(todoDate);
        });
      case 'closed':
        return filteredTodos.filter(
          (todo) => todo.status === 'Completed' || todo.status === 'Cancelled'
        );
      default:
        return filteredTodos;
    }
  };

  const getPaginatedTodos = () => {
    const todos = isActivityView
      ? filteredTodos.sort(
          (a, b) =>
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        )
      : getTodosByTab();

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return todos.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(
    (isActivityView ? filteredTodos.length : getTodosByTab().length) /
      ITEMS_PER_PAGE
  );

  useEffect(() => {
    updateState({
      currentPage: 1,
    });
  }, [searchQuery, activeTab, todoFilters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({
      searchQuery: e.target.value,
      currentPage: 1,
    });
  };

  const handleTabChange = (tab: typeof activeTab) => {
    updateState({
      activeTab: tab,
      currentPage: 1,
    });
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

  const handleDeleteTodo = (todoId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTodo(todoId);
    }
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    }
    return format(date, 'dd MMM, h:mm a');
  };

  const getLeadName = (leadId: number) => {
    const lead = getLeadById(leadId);
    return lead ? lead.name : 'Unknown Lead';
  };

  const getLeadBudget = (leadId: number) => {
    const lead = getLeadById(leadId);
    return lead ? lead.budget : 'Unknown Budget';
  };

  const displayTodos = getPaginatedTodos();

  return (
    <>
      <div className="p-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex mt-4 md:mt-0 space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
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
              onClick={clearTodoFilters}
            >
              <X size={14} className="mr-1" />
              Clear All
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {!isActivityView && (
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 px-4">
                <button
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'today'
                      ? 'border-blue-800 text-blue-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('today')}
                >
                  Today
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'upcoming'
                      ? 'border-blue-800 text-blue-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'overdue'
                      ? 'border-blue-800 text-blue-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('overdue')}
                >
                  Overdue
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'closed'
                      ? 'border-blue-800 text-blue-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('closed')}
                >
                  Closed
                </button>
              </nav>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {displayTodos.map((todo) => (
              <div key={todo.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleTodoClick(todo)}
                  >
                    <h3 className="font-medium mt-1 truncate">
                      #{todo.id} - {todo.title}
                    </h3>

                    {todo.description && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {todo.description}
                      </p>
                    )}
                    <button
                      className="text-blue-700 hover:text-blue-900 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeadClick(todo.leadId);
                      }}
                    >
                      {todo.leadId}. {getLeadName(todo.leadId)} -{' '}
                      {getLeadBudget(todo.leadId)}L
                    </button>

                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDateTime(todo.dateTime)}</span>
                      <div className="flex items-center space-x-2 px-2">
                        <Badge
                          label={todo.type}
                          color={
                            todo.type === 'Meeting'
                              ? 'purple'
                              : todo.type === 'Follow Up'
                              ? 'blue'
                              : 'gray'
                          }
                        />
                      </div>
                      {todo.status !== 'Pending' && (
                        <Badge
                          label={todo.status}
                          color={todo.status === 'Completed' ? 'green' : 'red'}
                          className="ml-2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {todo.status === 'Pending' ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        onClick={() => handleTodoAction(todo, 'reopen')}
                        title="Reopen task"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {displayTodos.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tasks found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? 'No tasks match your search criteria'
                    : `No ${activeTab} tasks found`}
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 py-3 px-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    updateState({ currentPage: Math.max(1, currentPage - 1) })
                  }
                  disabled={currentPage === 1}
                  className="btn btn-outline py-1 px-3 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    updateState({
                      currentPage: Math.min(totalPages, currentPage + 1),
                    })
                  }
                  disabled={currentPage === totalPages}
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
        defaultType={defaultType}
      />

      <AddTodoModal
        isOpen={isAddTodoModalOpen}
        onClose={() => setIsAddTodoModalOpen(false)}
        defaultType={defaultType}
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
    </>
  );
};

export default TodosList;
