import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, PlusCircle, Edit } from 'lucide-react';

const UserSubmissionsTracking = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      const response = await mockFetchSubmissions(activeTab);
      setSubmissions(response.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo purposes
  const mockFetchSubmissions = (tab) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSubmissions = [
          { 
            id: 1, 
            name: 'Coffee & Code', 
            address: '123 Main St, San Francisco, CA', 
            submittedDate: '2025-03-01T14:30:00Z',
            status: 'pending',
            statusText: 'Pending Review',
            photo: '/api/placeholder/400/300'
          },
          { 
            id: 2, 
            name: 'ByteBrew Cafe', 
            address: '456 Market St, New York, NY', 
            submittedDate: '2025-02-15T10:15:00Z',
            status: 'approved',
            statusText: 'Approved',
            photo: '/api/placeholder/400/300',
            approvedDate: '2025-02-17T09:23:00Z'
          },
          { 
            id: 3, 
            name: 'Remote Workspace', 
            address: '789 Oak Ave, Chicago, IL', 
            submittedDate: '2025-02-10T09:45:00Z',
            status: 'rejected',
            statusText: 'Rejected',
            photo: '/api/placeholder/400/300',
            rejectionReason: 'This location does not meet our criteria for work-friendly spaces. The venue does not allow customers to work for extended periods.',
            rejectedDate: '2025-02-12T11:30:00Z'
          }
        ];
        
        let filteredSubmissions = allSubmissions;
        
        if (tab !== 'all') {
          filteredSubmissions = allSubmissions.filter(submission => submission.status === tab);
        }
        
        resolve({
          submissions: filteredSubmissions
        });
      }, 500);
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor;
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'approved':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'rejected':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status === 'pending' ? 'Pending Review' : status === 'approved' ? 'Approved' : 'Rejected'}</span>
      </span>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
          <PlusCircle className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No locations submitted yet</h3>
        <p className="text-gray-500 mb-6">Add your favorite work-friendly cafes and help the community</p>
        <button 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/add-location'}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Location
        </button>
      </div>
    );
  };

  const renderTabs = () => {
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'all' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            All Submissions
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'pending' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'approved' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'rejected' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Rejected
          </button>
        </nav>
      </div>
    );
  };

  const renderSubmissions = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (submissions.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="relative h-48">
              <img 
                src={submission.photo} 
                alt={submission.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                {getStatusBadge(submission.status)}
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 truncate">{submission.name}</h3>
              <p className="mt-1 text-sm text-gray-500 truncate">{submission.address}</p>
              <p className="mt-3 text-xs text-gray-400">
                Submitted on {new Date(submission.submittedDate).toLocaleDateString()}
              </p>
              
              {submission.status === 'approved' && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400">
                    Approved on {new Date(submission.approvedDate).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex justify-between">
                    <a 
                      href={`/location/${submission.id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      View Location
                    </a>
                    <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </button>
                  </div>
                </div>
              )}
              
              {submission.status === 'rejected' && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Rejected on {new Date(submission.rejectedDate).toLocaleDateString()}
                  </p>
                  <div className="p-3 bg-red-50 rounded-md">
                    <p className="text-xs text-red-700">
                      <strong>Reason:</strong> {submission.rejectionReason}
                    </p>
                  </div>
                  <div className="mt-3">
                    <button 
                      onClick={() => window.location.href = `/edit-location/${submission.id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit & Resubmit
                    </button>
                  </div>
                </div>
              )}
              
              {submission.status === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-xs text-yellow-700">
                    Your submission is currently being reviewed by our team. This typically takes 1-2 business days.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Submitted Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage the locations you've submitted
          </p>
        </div>
        <button 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/add-location'}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Location
        </button>
      </div>
      
      {renderTabs()}
      {renderSubmissions()}
    </div>
  );
};

export default UserSubmissionsTracking;