import { NextRequest, NextResponse } from "next/server";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// In-memory store — resets on cold start (no database by design)
const tasks: Task[] = [
  {
    id: "1",
    title: "Review project requirements",
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Set up Next.js project",
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Deploy to Vercel",
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = (body?.title ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task: Task = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  task.completed = !task.completed;
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  tasks.splice(index, 1);
  return NextResponse.json({ success: true });
}
