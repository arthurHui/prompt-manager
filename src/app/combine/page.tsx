'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import Link from 'next/link';
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

export default function CombinePrompts() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    console.log('allPrompts', allPrompts)

    // Selected prompts for each category
    const [selectedCharacter, setSelectedCharacter] = useState<Prompt | null>(null);
    const [selectedBackground, setSelectedBackground] = useState<Prompt | null>(null);
    const [selectedPose, setSelectedPose] = useState<Prompt | null>(null);

    // Filtered prompts by type
    const [characterPrompts, setCharacterPrompts] = useState<Prompt[]>([]);
    const [backgroundPrompts, setBackgroundPrompts] = useState<Prompt[]>([]);
    const [posePrompts, setPosePrompts] = useState<Prompt[]>([]);

    // Combined result
    const [combinedPrompt, setCombinedPrompt] = useState('');

    // Search and filter states
    const [searchTitle, setSearchTitle] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tagDropdownOpen) {
                const target = event.target as Element;
                if (!target.closest('[data-dropdown="tag-filter"]')) {
                    setTagDropdownOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tagDropdownOpen]);

    useEffect(() => {
        if (isLoaded) {
            if (!isSignedIn) {
                // Redirect to sign-in page
                router.push('/sign-in');
                return;
            }
            fetchPrompts();
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        // Extract all unique tags
        const tags = [...new Set(allPrompts.flatMap(prompt => prompt.tags || []))];
        setAllTags(tags);
    }, [allPrompts]);

    useEffect(() => {
        // Only filter by type since search and tags are now handled server-side
        const characters = allPrompts.filter(p =>
            p.type.toLowerCase() === 'character' ||
            p.type.toLowerCase().includes('character') ||
            p.type.toLowerCase().includes('person') ||
            p.tags.some(tag => tag.toLowerCase().includes('character'))
        );

        const backgrounds = allPrompts.filter(p =>
            p.type.toLowerCase() === 'background' ||
            p.type.toLowerCase().includes('background') ||
            p.type.toLowerCase().includes('scene') ||
            p.tags.some(tag => tag.toLowerCase().includes('background'))
        );

        const poses = allPrompts.filter(p =>
            p.type.toLowerCase() === 'pose' ||
            p.type.toLowerCase().includes('pose') ||
            p.type.toLowerCase().includes('action') ||
            p.tags.some(tag => tag.toLowerCase().includes('pose'))
        );

        setCharacterPrompts(characters);
        setBackgroundPrompts(backgrounds);
        setPosePrompts(poses);

        console.log('Type filtering results:', {
            total: allPrompts.length,
            characters: characters.length,
            backgrounds: backgrounds.length,
            poses: poses.length
        });
    }, [allPrompts]);

    const generateCombinedPrompt = useCallback(() => {
        const parts = [];

        if (selectedCharacter) {
            parts.push(selectedCharacter.prompt);
        }

        if (selectedBackground) {
            parts.push(selectedBackground.prompt);
        }

        if (selectedPose) {
            parts.push(selectedPose.prompt);
        }

        setCombinedPrompt(parts.join(', '));
    }, [selectedCharacter, selectedBackground, selectedPose]);

    useEffect(() => {
        // Generate combined prompt when selections change
        generateCombinedPrompt();
    }, [generateCombinedPrompt]);

    const fetchPrompts = async (searchTerm = '', selectedTagsParam: string[] = []) => {
        setSearchLoading(true);
        setIsLoading(true);
        setError('');

        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }
            if (selectedTagsParam.length > 0) {
                selectedTagsParam.forEach(tag => params.append('tags', tag));
            }

            const url = `/api/prompts${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch prompts');
            }
            const result = await response.json();
            console.log('API response:', result);
            // The API returns data in result.data, not result.prompts
            setAllPrompts(result.data || []);
        } catch (error) {
            console.error('Error fetching prompts:', error);
            setError('Failed to load prompts. Please try again.');
        } finally {
            setSearchLoading(false);
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        fetchPrompts(searchTitle, selectedTags);
    };

    const handleSearch = () => {
        fetchPrompts(searchTitle, selectedTags);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const copyToClipboard = async () => {
        if (!combinedPrompt.trim()) {
            toast.warning('No prompt to copy. Please select at least one element.');
            return;
        }

        try {
            await navigator.clipboard.writeText(combinedPrompt);
            toast.success('Combined prompt copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            toast.error('Failed to copy prompt');
        }
    };

    const saveCombinedPrompt = async () => {
        if (!combinedPrompt.trim()) {
            toast.warning('No prompt to save. Please select at least one element.');
            return;
        }

        const title = `Combined: ${selectedCharacter?.title || 'Character'} + ${selectedBackground?.title || 'Background'} + ${selectedPose?.title || 'Pose'}`;

        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    prompt: combinedPrompt,
                    type: 'Combined',
                    tags: ['combined', 'generated'],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save prompt');
            }

            toast.success('Combined prompt saved successfully!');

            // Reset selections
            setSelectedCharacter(null);
            setSelectedBackground(null);
            setSelectedPose(null);
            setCombinedPrompt('');

        } catch (error) {
            console.error('Error saving prompt:', error);
            toast.error('Failed to save prompt');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Loading Overlay */}
            {(!isLoaded || isLoading) && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-white">Loading prompts...</p>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-2xl font-bold text-gray-900">
                                Prompt Manager
                            </Link>
                            <span className="text-gray-500">|</span>
                            <h1 className="text-xl font-semibold text-gray-700">Combine Prompts</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Back to Dashboard
                            </Link>
                            <Link
                                href="/create"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                            >
                                Create New Prompt
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & Filter */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h2>
                    <p className="text-sm text-gray-600 mb-4">Filter prompts to find what you need for your combination.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search by title */}
                        <div className="relative flex">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by title... (Press Enter to search)"
                                value={searchTitle}
                                onChange={(e) => setSearchTitle(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={searchLoading}
                                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {searchLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching...
                                    </>
                                ) : (
                                    'Search'
                                )}
                            </button>
                        </div>

                        {/* Tag filter dropdown */}
                        <div className="relative md:col-span-2" data-dropdown="tag-filter">
                            <button
                                onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <span className="text-gray-700">
                                    {selectedTags.length === 0 ? 'Select tags...' : `${selectedTags.length} tag(s) selected`}
                                </span>
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {tagDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                    <div className="px-3 py-2 border-b border-gray-200">
                                        <input
                                            type="text"
                                            placeholder="Search tags..."
                                            value={tagSearchTerm}
                                            onChange={(e) => setTagSearchTerm(e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {allTags
                                        .filter(tag => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                                        .map((tag) => (
                                            <div
                                                key={tag}
                                                onClick={() => {
                                                    let newSelectedTags;
                                                    if (selectedTags.includes(tag)) {
                                                        newSelectedTags = selectedTags.filter(t => t !== tag);
                                                    } else {
                                                        newSelectedTags = [...selectedTags, tag];
                                                    }
                                                    setSelectedTags(newSelectedTags);
                                                    // Trigger search with new tags
                                                    fetchPrompts(searchTitle, newSelectedTags);
                                                }}
                                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 ${selectedTags.includes(tag) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                                    }`}
                                            >
                                                <span className="block truncate">{tag}</span>
                                                {selectedTags.includes(tag) && (
                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        ))}

                                    {allTags.filter(tag => tag.toLowerCase().includes(tagSearchTerm.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-2 text-gray-500 text-sm">No tags found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected filters display */}
                    {(searchTitle || selectedTags.length > 0) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {searchTitle && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    Search: &ldquo;{searchTitle}&rdquo;
                                    <button
                                        onClick={() => {
                                            setSearchTitle('');
                                            fetchPrompts('', selectedTags);
                                        }}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            )}

                            {selectedTags.map((tag) => (
                                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {tag}
                                    <button
                                        onClick={() => {
                                            const newSelectedTags = selectedTags.filter(t => t !== tag);
                                            setSelectedTags(newSelectedTags);
                                            fetchPrompts(searchTitle, newSelectedTags);
                                        }}
                                        className="ml-2 text-green-600 hover:text-green-800"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}

                            <button
                                onClick={() => {
                                    setSearchTitle('');
                                    setSelectedTags([]);
                                    fetchPrompts('', []);
                                }}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Character Selection */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Character ({characterPrompts.length} available)
                        </h2>

                        <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                            {characterPrompts.map((prompt) => (
                                <div
                                    key={prompt._id}
                                    onClick={() => setSelectedCharacter(selectedCharacter?._id === prompt._id ? null : prompt)}
                                    className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-all shadow-sm hover:shadow-md ${selectedCharacter?._id === prompt._id
                                            ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-sm font-medium">
                                        {prompt.title}
                                    </span>
                                </div>
                            ))}

                            {characterPrompts.length === 0 && allPrompts.length > 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No character-specific prompts found. All your prompts are available for selection.
                                </p>
                            )}

                            {allPrompts.length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No prompts found. <Link href="/create" className="text-blue-600 hover:text-blue-800">Create your first prompt</Link> to get started.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Background Selection */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Background ({backgroundPrompts.length} available)
                        </h2>

                        <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                            {backgroundPrompts.map((prompt) => (
                                <div
                                    key={prompt._id}
                                    onClick={() => setSelectedBackground(selectedBackground?._id === prompt._id ? null : prompt)}
                                    className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-all shadow-sm hover:shadow-md ${selectedBackground?._id === prompt._id
                                            ? 'border-green-500 bg-green-100 text-green-800 shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-sm font-medium">
                                        {prompt.title}
                                    </span>
                                </div>
                            ))}

                            {backgroundPrompts.length === 0 && allPrompts.length > 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No background-specific prompts found. All your prompts are available for selection.
                                </p>
                            )}

                            {allPrompts.length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No prompts found. <Link href="/create" className="text-blue-600 hover:text-blue-800">Create your first prompt</Link> to get started.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Pose Selection */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Pose ({posePrompts.length} available)
                        </h2>

                        <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                            {posePrompts.map((prompt) => (
                                <div
                                    key={prompt._id}
                                    onClick={() => setSelectedPose(selectedPose?._id === prompt._id ? null : prompt)}
                                    className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-all shadow-sm hover:shadow-md ${selectedPose?._id === prompt._id
                                            ? 'border-purple-500 bg-purple-100 text-purple-800 shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-sm font-medium">
                                        {prompt.title}
                                    </span>
                                </div>
                            ))}

                            {posePrompts.length === 0 && allPrompts.length > 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No pose-specific prompts found. All your prompts are available for selection.
                                </p>
                            )}

                            {allPrompts.length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No prompts found. <Link href="/create" className="text-blue-600 hover:text-blue-800">Create your first prompt</Link> to get started.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Combined Result */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Combined Prompt</h2>

                    <div className="mb-4">
                        <textarea
                            value={combinedPrompt}
                            onChange={(e) => setCombinedPrompt(e.target.value)}
                            placeholder="Combined prompt will appear here... You can also edit it manually."
                            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!combinedPrompt.trim()}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                        </button>

                        <button
                            onClick={saveCombinedPrompt}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!combinedPrompt.trim()}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>Save as New Prompt</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedCharacter(null);
                                setSelectedBackground(null);
                                setSelectedPose(null);
                                setCombinedPrompt('');
                            }}
                            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Reset All</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
