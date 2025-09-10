'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';

const PROMPT_TYPES = ['Character', 'Background', 'Pose'];

export default function CreatePrompt() {
    const { isLoaded, isSignedIn } = useUser();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;
    const [formData, setFormData] = useState({
        title: '',
        prompt: '',
        type: '',
        image: '',
        tags: [] as string[],
    });
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingTags, setExistingTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear image preview if URL field is being modified
        if (name === 'image') {
            setImagePreview(value);
        }
    };

    const handleImageUpload = (url: string) => {
        setFormData(prev => ({
            ...prev,
            image: url,
        }));
        setImagePreview(url);
    };

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !formData.tags.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmedTag]
            }));
            if (!existingTags.includes(trimmedTag)) {
                setExistingTags(prev => [...prev, trimmedTag].sort());
            }
        }
        setTagInput('');
        setShowTagSuggestions(false);
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTagInput(value);
        setShowTagSuggestions(value.length > 0);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput);
        } else if (e.key === 'Escape') {
            setShowTagSuggestions(false);
        }
    };

    const filteredTags = existingTags.filter(tag =>
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !formData.tags.includes(tag)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const dataToSubmit = {
                ...formData,
            };

            const url = isEditMode ? `/api/prompts/${editId}` : '/api/prompts';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (result.success) {
                router.push('/');
            } else {
                setError(result.error || `Failed to ${isEditMode ? 'update' : 'create'} prompt`);
            }
        } catch (err) {
            console.error('Error submitting prompt:', err);
            setError(`Failed to ${isEditMode ? 'update' : 'create'} prompt. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Authentication check
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tags');
                const result = await response.json();
                if (result.success) {
                    setExistingTags(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch tags:', error);
            }
        };

        if (isSignedIn) {
            fetchTags();
        }
    }, [isSignedIn]);

    // Load prompt data for editing
    useEffect(() => {
        const fetchPromptForEdit = async () => {
            if (!isEditMode || !editId || !isSignedIn) return;
            
            try {
                const response = await fetch(`/api/prompts/${editId}`);
                const result = await response.json();
                
                if (result.success) {
                    const prompt = result.data;
                    setFormData({
                        title: prompt.title || '',
                        prompt: prompt.prompt || '',
                        type: prompt.type || '',
                        image: prompt.image || '',
                        tags: prompt.tags || [],
                    });
                    if (prompt.image) {
                        setImagePreview(prompt.image);
                    }
                } else {
                    setError('Failed to load prompt for editing');
                }
            } catch (error) {
                console.error('Failed to fetch prompt for editing:', error);
                setError('Failed to load prompt for editing');
            }
        };

        fetchPromptForEdit();
    }, [isEditMode, editId, isSignedIn]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!isSignedIn) {
        router.push('/sign-in');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        {isEditMode ? 'Edit Prompt' : 'Create New Prompt'}
                    </h1>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter prompt title"
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                Type *
                            </label>
                            <div className="relative">
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-colors duration-200 hover:border-gray-400"
                                >
                                    <option value="" disabled className="text-gray-500">
                                        Choose a type...
                                    </option>
                                    {PROMPT_TYPES.map((type) => (
                                        <option key={type} value={type} className="text-gray-900 py-2">
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                                Prompt *
                            </label>
                            <textarea
                                id="prompt"
                                name="prompt"
                                value={formData.prompt}
                                onChange={handleChange}
                                required
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your prompt content"
                            />
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                                Image URL (optional)
                            </label>
                            <input
                                type="url"
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <CldUploadWidget
                            signatureEndpoint={"/api/images"}
                            options={{
                                maxFiles: 1,
                                resourceType: 'image',
                            }}
                            onSuccess={(result) => {
                                console.log("Upload Successful:", result);
                                if (result.info && typeof result.info === 'object') {
                                    console.log("Uploaded File Info:", result.info);
                                    handleImageUpload(result.info.secure_url);
                                }
                            }}
                        >
                            {({ open }) => {
                                return (
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => open()}
                                    >
                                        Upload an Image
                                    </button>
                                );
                            }}
                        </CldUploadWidget>

                        {imagePreview && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image Preview
                                </label>
                                <div className="border border-gray-300 rounded-md overflow-hidden relative h-48">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags (optional)
                            </label>
                            <div className="space-y-2">
                                {/* Selected Tags */}
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Tag Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={handleTagInputChange}
                                        onKeyDown={handleTagInputKeyDown}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Type to add tags..."
                                    />

                                    {/* Tag Suggestions */}
                                    {showTagSuggestions && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredTags.length > 0 ? (
                                                filteredTags.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => addTag(tag)}
                                                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                    >
                                                        {tag}
                                                    </button>
                                                ))
                                            ) : tagInput.trim() ? (
                                                <button
                                                    type="button"
                                                    onClick={() => addTag(tagInput)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-blue-600"
                                                >
                                                    Create &ldquo;{tagInput.trim()}&rdquo;
                                                </button>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading 
                                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                                    : (isEditMode ? 'Update Prompt' : 'Create Prompt')
                                }
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
