import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Prompt from '@/models/Prompt';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get all unique tags for the user
    const result = await Prompt.aggregate([
      { $match: { userId } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags" } },
      { $sort: { _id: 1 } }
    ]);
    
    const tags = result.map(item => item._id);
    
    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
