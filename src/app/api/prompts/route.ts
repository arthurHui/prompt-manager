import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Prompt from '@/models/Prompt';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const types = searchParams.get('types');
    const tags = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    
    // Build the MongoDB query
    const query: Record<string, unknown> = { userId };
    
    // Add search filter for title
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }
    
    // Add type filter
    if (types) {
      const typeArray = types.split(',').filter(t => t.trim());
      if (typeArray.length > 0) {
        query.type = { $in: typeArray };
      }
    }
    
    // Add tags filter (prompts that contain ALL specified tags)
    if (tags) {
      const tagArray = tags.split(',').filter(t => t.trim());
      if (tagArray.length > 0) {
        query.tags = { $all: tagArray };
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await Prompt.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get paginated results
    const prompts = await Prompt.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    return NextResponse.json({ 
      success: true, 
      data: prompts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const promptData = { ...body, userId };
    const prompt = await Prompt.create(promptData);
    return NextResponse.json({ success: true, data: prompt }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create prompt';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
