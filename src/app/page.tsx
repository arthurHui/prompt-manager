'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Prompt {
  _id: string;
  title: string;
  prompt: string;
  type: string;
  image?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const ITEMS_PER_PAGE = 30;

  const fetchFilteredPrompts = useCallback(async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchTitle.trim()) {
        params.append('search', searchTitle.trim());
      }
      
      if (selectedTypes.length > 0) {
        params.append('types', selectedTypes.join(','));
      }
      
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }
      
      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      
      const queryString = params.toString();
      const url = `/api/prompts${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setPrompts(result.data);
        setFilteredPrompts(result.data);
        
        // Update pagination state
        if (result.pagination) {
          setCurrentPage(result.pagination.currentPage);
          setTotalPages(result.pagination.totalPages);
          setTotalPrompts(result.pagination.totalCount);
        }
      } else {
        setError(result.error || 'Failed to fetch prompts');
      }
    } catch {
      setError('Failed to fetch prompts');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTitle, selectedTypes, selectedTags, ITEMS_PER_PAGE]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      const result = await response.json();

      if (result.success) {
        setAllTags(result.data);
      }
    } catch {
      console.error('Failed to fetch tags');
    }
  }, []);

  const fetchTypes = useCallback(async () => {
    try {
      // Fetch all prompts without filters to get all available types
      const response = await fetch('/api/prompts');
      const result = await response.json();

      if (result.success) {
        const types = Array.from(new Set(result.data.map((prompt: Prompt) => prompt.type))).filter(Boolean);
        setAllTypes(types as string[]);
      }
    } catch {
      console.error('Failed to fetch types');
    }
  }, []);

  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the data to get the latest results
        fetchFilteredPrompts();
      } else {
        alert('Failed to delete prompt');
      }
    } catch {
      alert('Failed to delete prompt');
    }
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedTypes([]);
    setSearchTitle('');
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchFilteredPrompts(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const copyToClipboard = async (text: string, type: 'title' | 'prompt') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type === 'title' ? 'Title' : 'Prompt'} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error(`Failed to copy ${type}`);
    }
  };

  // Effects for data fetching and event handling
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      fetchFilteredPrompts();
      fetchTags();
      fetchTypes();
    }
  }, [isLoaded, isSignedIn, router, fetchFilteredPrompts, fetchTags, fetchTypes]);

  // Fetch filtered prompts whenever search/filter criteria change (with debounce for search)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
    
    // Debounce search input
    const timeoutId = setTimeout(() => {
      fetchFilteredPrompts(1);
    }, searchTitle.trim() ? 300 : 0); // 300ms delay for search, immediate for other filters
    
    return () => clearTimeout(timeoutId);
  }, [selectedTags, selectedTypes, searchTitle, isLoaded, isSignedIn, fetchFilteredPrompts]);

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.type-dropdown')) {
        setTypeDropdownOpen(false);
        setTypeSearchTerm('');
      }
      if (!target.closest('.tag-dropdown')) {
        setTagDropdownOpen(false);
        setTagSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Prompt Manager</h1>
          <p className="text-gray-600 mb-8">Please sign in to manage your prompts</p>
          <Link
            href="/sign-in"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prompt Manager</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.firstName || `User`}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/combine"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Combine Prompts
            </Link>
            <Link
              href="/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Prompt
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Search & Filter</h3>
              {(selectedTags.length > 0 || selectedTypes.length > 0 || searchTitle.trim()) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            
            <div className="mb-3 text-xs text-gray-500">
              Click dropdowns to select multiple options. Use search to find specific items quickly.
            </div>
            
            {/* Search and Filter Controls in one line */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-10"
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Type Filter */}
              {allTypes.length > 0 && (
                <div className="relative type-dropdown">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm text-left bg-white flex justify-between items-center"
                    >
                      <span className="text-gray-500">
                        {selectedTypes.length > 0 
                          ? `${selectedTypes.length} type${selectedTypes.length > 1 ? 's' : ''} selected`
                          : 'Select types...'
                        }
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    </button>
                    
                    {typeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search types..."
                            value={typeSearchTerm}
                            onChange={(e) => setTypeSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTypes.length === allTypes.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTypes([...allTypes]);
                                } else {
                                  setSelectedTypes([]);
                                }
                              }}
                              className="mr-2 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium">All</span>
                          </label>
                          {allTypes
                            .filter(type => type.toLowerCase().includes(typeSearchTerm.toLowerCase()))
                            .map((type) => (
                            <label key={type} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTypes.includes(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTypes([...selectedTypes, type]);
                                  } else {
                                    setSelectedTypes(selectedTypes.filter(t => t !== type));
                                  }
                                }}
                                className="mr-2 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="relative tag-dropdown">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-left bg-white flex justify-between items-center"
                    >
                      <span className="text-gray-500">
                        {selectedTags.length > 0 
                          ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                          : 'Select tags...'
                        }
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tagDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    </button>
                    
                    {tagDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearchTerm}
                            onChange={(e) => setTagSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTags.length === allTags.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTags([...allTags]);
                                } else {
                                  setSelectedTags([]);
                                }
                              }}
                              className="mr-2 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">All</span>
                          </label>
                          {allTags
                            .filter(tag => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                            .map((tag) => (
                            <label key={tag} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTags([...selectedTags, tag]);
                                  } else {
                                    setSelectedTags(selectedTags.filter(t => t !== tag));
                                  }
                                }}
                                className="mr-2 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">{tag}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Filters Summary */}
            {(selectedTags.length > 0 || selectedTypes.length > 0 || searchTitle.trim()) ? (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Active filters:</span>
                  {searchTitle.trim() && <span className="ml-2">Title: &ldquo;{searchTitle}&rdquo;</span>}
                  {selectedTypes.length > 0 && <span className="ml-2">Types: {selectedTypes.length}</span>}
                  {selectedTags.length > 0 && <span className="ml-2">Tags: {selectedTags.length}</span>}
                  <span className="ml-2">• Page {currentPage} of {totalPages} • Showing {filteredPrompts.length} of {totalPrompts} prompts</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600">
                  <span>Page {currentPage} of {totalPages} • Showing {filteredPrompts.length} of {totalPrompts} prompts</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            {prompts.length === 0 ? (
              <>
                <h2 className="text-xl text-gray-600 mb-4">No prompts found</h2>
                <Link
                  href="/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Prompt
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-xl text-gray-600 mb-4">
                  No prompts match your current filters
                </h2>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div key={prompt._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {prompt.image && (
                  <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
                    <Image
                      src={prompt.image}
                      alt={prompt.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                        {prompt.title}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(prompt.title, 'title')}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy title"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                      {prompt.type}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-start gap-2">
                      <p className="text-gray-600 line-clamp-3 flex-1">
                        {prompt.prompt}
                      </p>
                      <button
                        onClick={() => copyToClipboard(prompt.prompt, 'prompt')}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy prompt"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {prompt.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mb-3">
                    Created: {new Date(prompt.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/create?edit=${prompt._id}`}
                      className="flex-1 bg-blue-600 text-white text-center px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deletePrompt(prompt._id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalPrompts)} of {totalPrompts} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {/* Show page numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
