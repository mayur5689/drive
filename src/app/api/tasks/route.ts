import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('request_id');

        const supabase = createServiceClient();
        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:assigned_to (id, full_name),
                creator:created_by (id, full_name),
                request_links:task_request_links (
                    request:request_id (id, title)
                )
            `)
            .order('created_at', { ascending: false });

        if (requestId) {
            // If request_id is provided, filter tasks that have a link to this request
            const { data: linkedTasks } = await supabase
                .from('task_request_links')
                .select('task_id')
                .eq('request_id', requestId);

            const taskIds = (linkedTasks || []).map(lt => lt.task_id);
            query = query.in('id', taskIds);
        }

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createServiceClient();
        const body = await request.json();
        const { request_ids, ...taskData } = body;

        // 1. Create the task
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single();

        if (taskError) throw taskError;

        // 2. Create request links if provided
        if (request_ids && Array.isArray(request_ids) && request_ids.length > 0) {
            const links = request_ids.map(rid => ({
                task_id: newTask.id,
                request_id: rid
            }));

            const { error: linkError } = await supabase
                .from('task_request_links')
                .insert(links);

            if (linkError) throw linkError;
        }

        return NextResponse.json(newTask);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createServiceClient();
        const body = await request.json();
        const { id, request_ids, ...updates } = body;

        if (!id) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

        // 1. Update task basic info
        const { data: updatedTask, error: taskError } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (taskError) throw taskError;

        // 2. Synchronize request links if request_ids is provided
        if (request_ids && Array.isArray(request_ids)) {
            // Remove existing links
            await supabase
                .from('task_request_links')
                .delete()
                .eq('task_id', id);

            // Add new links
            if (request_ids.length > 0) {
                const links = request_ids.map(rid => ({
                    task_id: id,
                    request_id: rid
                }));

                const { error: linkError } = await supabase
                    .from('task_request_links')
                    .insert(links);

                if (linkError) throw linkError;
            }
        }

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = createServiceClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ message: "Task deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
