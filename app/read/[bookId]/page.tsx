import ReadBookClient from './ReadBookClient';

export async function generateStaticParams() {
  return [];
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ReadBookPage() {
  return <ReadBookClient />;
}
