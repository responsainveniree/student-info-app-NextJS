
import React from 'react';
import { auth } from '@/lib/auth/authNode';
import MarkManagement from '@/components/dashboard/teacher/MarkManagement';


const page = async () => {
    const session = await auth();

    return (
        <MarkManagement session={session} />
    );
}

export default page
