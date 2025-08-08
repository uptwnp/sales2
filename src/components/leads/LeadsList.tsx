import React, { useState, useEffect } from 'react';
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
import { usePersistentState } from '../../hooks/usePersistentState';
import { formatPhoneNumber, getClipboardText, isValidPhoneNumber } from '../../utils/phone';

type SortField = 'id' | 'name' | 'budget' | 'stage' | 'created_at';
type SortDirection = 'asc' | 'desc';

const LeadsList: React.FC = () => {
  const { getFilteredLeads, leadFilters, clearLeadFilters, removeLeadFilter, fetchLeads, isLoading, getTodosByLeadId } = useAppContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const navigate = useNavigate();

  // Use persistent state for leads section
  const { state, updateState } = usePersistentState('leads');
  const { currentPage, sortField, sortDirection, searchQuery } = state;

  const leads = getFilteredLeads();
  const isInitialMount = React.useRef(true);

  // This effect handles resetting the page when filters or search query change.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      // Any change in filters or search will reset the page.
      updateState({ currentPage: 1 });
    }
  }, [leadFilters, searchQuery]);

  // This effect handles the data fetching.
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLeads({
        page: currentPage,
        perPage: 10,
        sortField,
        sortOrder: sortDirection,
        search: searchQuery,
        currentFilters: leadFilters,
      });
    }, 300); // Small debounce for all changes.

    return () => clearTimeout(handler);
  }, [currentPage, sortField, sortDirection, searchQuery, leadFilters]);

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    updateState({
      sortField: field,
      sortDirection: newDirection,
      currentPage: 1
    });
    
    fetchLeads({
      page: 1,
      perPage: 10,
      sortField: field,
      sortOrder: newDirection,
      search: searchQuery,
      currentFilters: leadFilters,
    });
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({
      searchQuery: e.target.value,
      currentPage: 1
    });
  };

  const handleSearchFocus = async () => {
    if (!searchQuery) {
      const clipboardText = await getClipboardText();
      const formattedNumber = formatPhoneNumber(clipboardText);
      if (isValidPhoneNumber(formattedNumber)) {
        updateState({ searchQuery: formattedNumber });
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    updateState({ currentPage: newPage });
    fetchLeads({
      page: newPage,
      perPage: 10,
      sortField,
      sortOrder: sortDirection,
      search: searchQuery,
      currentFilters: leadFilters,
    });
  };

  const propertyTypeLabel = (types: string[]) => {
    return types.join(', ');
  };

  const locationLabel = (locations: string[]) => {
    return locations.join(', ');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  return (
    <>
      <div className="p-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex mt-4 md:mt-0 space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
                className="input pr-10"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={handleSearchFocus}
              />
            </div>
            <button
              className="btn btn-outline flex items-center"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <Filter size={16} />
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setIsAddLeadModalOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

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
              onClick={clearLeadFilters}
            >
              <X size={14} className="mr-1" />
              Clear All
            </button>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center">
                      Loading...
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
                          {lead.tags.slice(0, 2).map((tag, idx) => (
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
                          {lead.propertyType.map((type, idx) => (
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
                  disabled={currentPage === 1 || isLoading}
                  className="btn btn-outline py-1 px-3 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={leads.length < 10 || isLoading}
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