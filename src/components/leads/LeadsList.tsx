import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  Filter,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import LeadFilterModal from './LeadFilterModal';
import AddLeadModal from './AddLeadModal';
import Badge from '../ui/Badge';
import LoadingIndicator from '../ui/LoadingIndicator';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useOptimizedDataFetching } from '../../hooks/useOptimizedDataFetching';
import { Lead } from '../../types';
import { dropdownOptions, tagOptions } from '../../data/options';
import Dropdown from '../common/Dropdown';
import TagInput from '../common/TagInput';

type SortField = 'id' | 'name' | 'budget' | 'stage' | 'created_at';
type SortDirection = 'asc' | 'desc';

const LeadsList: React.FC = () => {
  const { 
    getFilteredLeads, 
    leadFilters, 
    clearLeadFilters, 
    removeLeadFilter, 
    fetchLeads, 
    isLoading: contextLoading, 
    getTodosByLeadId,
    setLeadFilters
  } = useAppContext();
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const navigate = useNavigate();

  // Desktop filter states
  const [desktopStage, setDesktopStage] = useState('');
  const [desktopTags, setDesktopTags] = useState<string[]>([]);

  // Use persistent state for leads section
  const { state, updateState, clearFilters, clearSearch, clearAll, updateFilters } = usePersistentState('leads');
  const { currentPage, sortField, sortDirection, searchQuery, filters: savedFilters } = state;

  // Use optimized data fetching with caching
  const {
    data: cachedLeads,
    isLoading: isDataLoading,
    isBackgroundLoading,
    fetchData,
    backgroundRefresh
  } = useOptimizedDataFetching<Lead[]>(
    async (params) => {
      // Call fetchLeads and return the actual data from the API
      return await fetchLeads(params);
    },
    { ttl: 2 * 60 * 1000, maxSize: 20 } // 2 minutes cache
  );

  const leads = cachedLeads || [];

  const hasInitialData = React.useRef(false);
  const prevFiltersRef = React.useRef(leadFilters);
  const latestFiltersRef = React.useRef(leadFilters);
  const [isFiltersInitialized, setIsFiltersInitialized] = useState(false);
  const filtersClearedRef = React.useRef(false);
  const lastRequestParams = React.useRef<string>('');
  const lastRequestTime = React.useRef<number>(0);

  // Keep track of the latest filters
  useEffect(() => {
    latestFiltersRef.current = leadFilters;
  }, [leadFilters]);

  // Initialize filters from persistent state on mount
  useEffect(() => {
    if (savedFilters && savedFilters.length > 0 && leadFilters.length === 0) {
      setLeadFilters(savedFilters);
      setIsFiltersInitialized(true);
    } else {
      // Mark as initialized even if no saved filters or if filters already exist
      setIsFiltersInitialized(true);
    }
  }, []); // Empty dependency array - only run once on mount

  // Sync filters to persistent state when they change
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    if (JSON.stringify(prevFilters) !== JSON.stringify(leadFilters)) {
      // Check if filters were cleared
      const filtersCleared = prevFilters.length > 0 && leadFilters.length === 0;
      if (filtersCleared) {
        filtersClearedRef.current = true;
      }
      
      // Reset last request params when filters change significantly
      lastRequestParams.current = '';
      
      // Update persistent state with new filters
      updateFilters(leadFilters);
      prevFiltersRef.current = leadFilters;
      // Mark filters as initialized when they change
      setIsFiltersInitialized(true);
    }
  }, [leadFilters, updateFilters]);

  // Data fetching effect - only run after filters are initialized
  useEffect(() => {
    // Don't fetch data until filters are properly initialized
    if (!isFiltersInitialized) {
      return;
    }

    // Use shorter delay for filter changes to prevent lag
    const delay = leadFilters.length > 0 ? 100 : 300;

    const handler = setTimeout(() => {
      const params = {
        page: currentPage,
        perPage: 20,
        sortField,
        sortOrder: sortDirection,
        search: searchQuery,
        currentFilters: latestFiltersRef.current, // Use latest filters from ref
      };

      // Create a unique key for this request
      const requestKey = JSON.stringify(params);
      
      // Prevent duplicate requests with the same parameters
      if (lastRequestParams.current === requestKey) {
        return;
      }
      
      // Debounce: prevent requests that are too close together
      const now = Date.now();
      if (now - lastRequestTime.current < 500) { // 500ms minimum between requests
        return;
      }
      
      lastRequestParams.current = requestKey;
      lastRequestTime.current = now;

      if (hasInitialData.current) {
        backgroundRefresh(params);
      } else {
        fetchData(params);
        hasInitialData.current = true;
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [currentPage, sortField, sortDirection, searchQuery, leadFilters, fetchData, backgroundRefresh, isFiltersInitialized]);

  const handleSort = useCallback((field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    updateState({
      sortField: field,
      sortDirection: newDirection,
      currentPage: 1
    });
  }, [sortField, sortDirection, updateState]);

  const handleLeadClick = useCallback((leadId: number) => {
    navigate(`/leads/${leadId}`);
  }, [navigate]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateState({
      searchQuery: value,
      currentPage: 1
    });
  }, [updateState]);

  const handlePageChange = useCallback((newPage: number) => {
    updateState({ currentPage: newPage });
  }, [updateState]);

  const handleClearFilters = useCallback(() => {
    clearLeadFilters();
    clearFilters();
    // Force refresh data when filters are cleared
    if (hasInitialData.current) {
      const params = {
        page: currentPage,
        perPage: 20,
        sortField,
        sortOrder: sortDirection,
        search: searchQuery,
        currentFilters: [],
      };
      fetchData(params, { forceRefresh: true });
    }
  }, [clearLeadFilters, clearFilters, currentPage, sortField, sortDirection, searchQuery, fetchData]);

  const handleClearSearch = useCallback(() => {
    updateState({ searchQuery: '', currentPage: 1 });
  }, [updateState]);

  const handleClearAll = useCallback(() => {
    clearLeadFilters();
    clearAll();
    // Force refresh data when all filters are cleared
    if (hasInitialData.current) {
      const params = {
        page: currentPage,
        perPage: 20,
        sortField,
        sortOrder: sortDirection,
        searchQuery: '',
        currentFilters: [],
      };
      fetchData(params, { forceRefresh: true });
    }
  }, [clearLeadFilters, clearAll, currentPage, sortField, sortDirection, fetchData]);

  const propertyTypeLabel = (types: string[]) => {
    if (types.length === 0) return "Any";
    if (types.length === 1) return types[0];
    return `${types[0]} +${types.length - 1}`;
  };

  const locationLabel = (locations: string[]) => {
    if (locations.length === 0) return "Any";
    if (locations.length === 1) return locations[0];
    return `${locations[0]} +${locations.length - 1}`;
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  // Only show loading on initial load, not on background refreshes
  const showLoading = isDataLoading && !hasInitialData.current;
  const showBackgroundLoading = isBackgroundLoading && hasInitialData.current;

  // Handle desktop filter changes
  const handleDesktopStageChange = useCallback((value: string) => {
    setDesktopStage(value);
    
    // Update filters
    const newFilters = leadFilters.filter(filter => filter.field !== 'stage');
    if (value) {
      newFilters.push({ field: 'stage', operator: '=', value });
    }
    setLeadFilters(newFilters);
  }, [leadFilters, setLeadFilters]);

  const handleDesktopTagsChange = useCallback((tags: string[]) => {
    setDesktopTags(tags);
    
    // Update filters
    const newFilters = leadFilters.filter(filter => filter.field !== 'tags');
    if (tags.length > 0) {
      newFilters.push({ field: 'tags', operator: '=', value: tags });
    }
    setLeadFilters(newFilters);
  }, [leadFilters, setLeadFilters]);

  // Sync desktop filters with leadFilters
  useEffect(() => {
    const stageFilter = leadFilters.find(filter => filter.field === 'stage');
    const tagsFilter = leadFilters.find(filter => filter.field === 'tags');
    
    if (stageFilter) {
      setDesktopStage(stageFilter.value as string);
    } else {
      setDesktopStage('');
    }
    
    if (tagsFilter) {
      setDesktopTags(Array.isArray(tagsFilter.value) ? tagsFilter.value : [tagsFilter.value as string]);
    } else {
      setDesktopTags([]);
    }
  }, [leadFilters]);

  return (
    <>
      <div className="p-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2 w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
                className="input pr-10"
                value={searchQuery || ''}
                onChange={handleSearch}
              />
            </div>
            
            {/* Desktop-only filters in same line */}
            <div className="hidden md:flex md:space-x-2 md:flex-1">
              <div className="flex-1 max-w-xs">
                <Dropdown
                  options={dropdownOptions.stage}
                  value={desktopStage}
                  onChange={handleDesktopStageChange}
                  placeholder="All Stages"
                />
              </div>
              <div className="flex-1 max-w-xs">
                <TagInput
                  options={tagOptions.tags}
                  value={desktopTags}
                  onChange={handleDesktopTagsChange}
                  placeholder="Select tags..."
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                className="btn btn-outline flex items-center h-10 px-3"
                onClick={() => setIsFilterModalOpen(true)}
              >
                <Filter size={16} />
              </button>

              <button
                className="btn btn-primary flex items-center h-10 px-3"
                onClick={() => setIsAddLeadModalOpen(true)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop-only filter section - removed since moved to top line */}

        {leadFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
            <span className="text-sm font-medium text-gray-600">
              Active Filters:
            </span>
            {leadFilters.map((filter, index) => (
              <Badge
                key={index}
                label={`${filter.field}: ${filter.value}`}
                color="gray"
                onClose={() => removeLeadFilter(index)}
              />
            ))}
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
              <span className="ml-2">Refreshing data in background...</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th
                    className="table-header cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      ID {renderSortIcon('id')}
                    </div>
                  </th>
                  <th
                    className="table-header cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="table-header cursor-pointer"
                    onClick={() => handleSort('budget')}
                  >
                    <div className="flex items-center">
                      Budget {renderSortIcon('budget')}
                    </div>
                  </th>
                  <th
                    className="table-header cursor-pointer"
                    onClick={() => handleSort('stage')}
                  >
                    <div className="flex items-center w-20">
                      Stage {renderSortIcon('stage')}
                    </div>
                  </th>
                  <th className="table-header">Tags</th>
                  <th className="table-header">Tasks</th>
                  <th className="table-header">Property Type</th>
                  <th className="table-header">Preferred Location</th>
                  <th className="table-header">Requirements</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {showLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center">
                      <LoadingIndicator type="spinner" size="md" text="Loading leads..." />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchQuery
                        ? 'No leads found matching your search criteria'
                        : 'No leads found. Add your first lead to get started!'}
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleLeadClick(lead.id)}
                    >
                      <td className="table-cell font-medium">{lead.id}</td>
                      <td className="table-cell font-medium text-gray-700 truncate max-w-[150px]">
                        {lead.name}
                      </td>
                      <td className="table-cell">{lead.budget} Lakh</td>
                      <td className="table-cell">
                        <Badge
                          label={lead.stage}
                          className="table-cell max-w-[150px] truncate"
                          color={
                            lead.stage.includes('Init') ? 'blue' :
                            lead.stage.includes('Mid') ? 'purple' :
                            lead.stage.includes('Mat') ? 'green' :
                            lead.stage.includes('Deal') ? 'yellow' :
                            lead.stage.includes('Neg') ? 'red' :
                            'gray' // for 'Other' or anything else
                          }
                        />
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 2).map((tag: string, idx: number) => (
                            <Badge key={idx} label={tag} color="gray" small />
                          ))}
                          {lead.tags.length > 2 && (
                            <Badge
                              label={`+${lead.tags.length - 2}`}
                              color="gray"
                              small
                            />
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <Badge
                          label={`${getTodosByLeadId(lead.id).length}`}
                          color="blue"
                        />
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {lead.propertyType.map((type: string, idx: number) => (
                            <Badge key={idx} label={type} color="gray" small />
                          ))}
                        </div>
                      </td>
                      <td className="table-cell truncate max-w-[200px]">
                        {locationLabel(lead.preferredLocation)}
                      </td>
                      <td className="table-cell truncate max-w-[200px]">
                        {lead.requirementDescription || 'No description provided'}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${lead.phone}`);
                            }}
                          >
                            <Phone size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-green-600 rounded-full hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${lead.phone}`);
                            }}
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {leads.length > 0 && (
            <div className="bg-gray-50 py-3 px-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage}
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={leads.length < 20 || showLoading}
                  className="btn btn-outline py-1 px-3 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LeadFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />
    </>
  );
};

export default LeadsList;