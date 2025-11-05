import { NextRequest, NextResponse } from 'next/server';

// This endpoint fetches all projects with key financial data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'Active';

    // In a real implementation, this would call the QuickBase MCP
    // For now, we'll return mock data structure that matches the schema

    const response = {
      projects: [],
      totalCount: 0,
      status: 'success'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
