import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, ArrowLeft, ArrowRight, Filter, Search } from 'lucide-react';

const AdminLocationDashboard = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLocations();
  }, [currentPage, filter]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      const response = await mockFetchLocations(currentPage, filter, searchTerm);
      setLocations(response.locations);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLocations();
  };

  const handleApprove = async (id) => {
    try {
      // In a real app, this would be an API call
      await mockApproveLocation(id);
      fetchLocations();
      
      if (selectedLocation && selectedLocation.id === id) {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('Error approving location:', error);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      // In a real app, this would be an API call
      await mockRejectLocation(id, rejectionReason);
      fetchLocations();
      
      if (selectedLocation && selectedLocation.id === id) {
        setSelectedLocation(null);
      }
      
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting location:', error);
    }
  };

  const viewLocationDetails = (location) => {
    setSelectedLocation(location);
  };

  const goBack = () => {
    setSelectedLocation(null);
  };

  // Mock data and functions for demo purposes
  const mockFetchLocations = (page, filter, search) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredLocations = [
          { 
            id: 1, 
            name: 'Coffee & Code', 
            address: '123 Main St, San Francisco, CA', 
            submittedBy: 'John Doe',
            submittedOn: '2025-03-01T14:30:00Z',
            status: 'pending',
            hasWifi: true,
            powerOutlets: 'Abundant',
            noiseLevel: 'Quiet',
            photos: ['/api/placeholder/400/300']
          },
          { 
            id: 2, 
            name: 'ByteBrew Cafe', 
            address: '456 Market St, New York, NY', 
            submittedBy: 'Jane Smith',
            submittedOn: '2025-03-02T10:15:00Z',
            status: 'pending',
            hasWifi: true,
            powerOutlets: 'Limited',
            noiseLevel: 'Moderate',
            photos: ['/api/placeholder/400/300']
          },
          { 
            id: 3, 
            name: 'Remote Workspace', 
            address: '789 Oak Ave, Chicago, IL', 
            submittedBy: 'Alex Johnson',
            submittedOn: '2025-03-03T09:45:00Z',
            status: 'pending',
            hasWifi: true,
            powerOutlets: 'Abundant',
            noiseLevel: 'Very Quiet',
            photos: ['/api/placeholder/400/300']
          }
        ];
        
        if (filter !== 'all') {
          filteredLocations = filteredLocations.filter(loc => loc.status === filter);
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredLocations = filteredLocations.filter(loc => 
            loc.name.toLowerCase().includes(searchLower) || 
            loc.address.toLowerCase().includes(searchLower)
          );
        }
        
        resolve({
          locations: filteredLocations,
          totalPages: Math.ceil(filteredLocations.length / 10)
        });
      }, 500);
    });
  };

  const mockApproveLocation = (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  };

  const mockRejectLocation = (id, reason) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  };

  // Render the filters and search
  const renderFilters = () => {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Locations</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Locations
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rendering the location list view
  const renderLocationList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (locations.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending locations found.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Submitted By</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
              <th scope="col" className="relative px-3 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {locations.map((location) => (
              <tr key={location.id}>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{location.name}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{location.address}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{location.submittedBy}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {new Date(location.submittedOn).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => viewLocationDetails(location)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Eye size={18} className="inline mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleApprove(location.id)}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    <CheckCircle size={18} className="inline mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      viewLocationDetails(location);
                      document.getElementById('rejection-reason').focus();
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <XCircle size={18} className="inline mr-1" />
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Rendering pagination controls
  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                  currentPage === 1
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                  currentPage === totalPages
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                <span className="sr-only">Next</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Rendering the detailed view of a location
  const renderLocationDetail = () => {
    if (!selectedLocation) return null;

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Location Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Review submission details before approval</p>
          </div>
          <button
            onClick={goBack}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">{selectedLocation.name}</h4>
              <p className="text-gray-700 mb-2">{selectedLocation.address}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Submitted by: {selectedLocation.submittedBy}</p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(selectedLocation.submittedOn).toLocaleString()}
                </p>
              </div>
              
              <div className="mt-6">
                <h5 className="text-md font-medium text-gray-900 mb-2">Work-Friendly Features</h5>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${selectedLocation.hasWifi ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{selectedLocation.hasWifi ? 'Wi-Fi Available' : 'No Wi-Fi'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-3 h-3 rounded-full mr-2 mt-1 bg-blue-500"></span>
                    <span>Power Outlets: {selectedLocation.powerOutlets}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-3 h-3 rounded-full mr-2 mt-1 bg-yellow-500"></span>
                    <span>Noise Level: {selectedLocation.noiseLevel}</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <img 
                  src={selectedLocation.photos[0]} 
                  alt={selectedLocation.name} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason (required for rejection)
                  </label>
                  <textarea
                    id="rejection-reason"
                    rows="4"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Explain why this location is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleApprove(selectedLocation.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Location
                  </button>
                  <button
                    onClick={() => handleReject(selectedLocation.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage submitted work-friendly locations
        </p>
      </div>

      {selectedLocation ? (
        renderLocationDetail()
      ) : (
        <>
          {renderFilters()}
          {renderLocationList()}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default AdminLocationDashboard;