import { redirect } from 'next/navigation';

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/movies/${id}?tab=media`);
}
