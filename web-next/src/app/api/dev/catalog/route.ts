import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const snapshotPath = path.resolve(process.cwd(), 'src/storefront/data/dev-catalog-snapshot.json');
    if (!fs.existsSync(snapshotPath)) {
      return NextResponse.json(
        { error: 'Snapshot not found. Run "node scripts/generate-dev-catalog-snapshot.mjs"' },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error serving dev catalog snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
