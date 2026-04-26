import { Injectable, NotFoundException } from '@nestjs/common';
import type { Task } from './task.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  findAll(): Task[] {
    return this.tasks;
  }

  create(title: string): Task {
    const task: Task = {
      id: randomUUID(),
      title,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  toggle(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Task with id ${id} not found`);
    task.status = task.status === 'pending' ? 'completed' : 'pending';
    return task;
  }

  update(id: string, title: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Task with id ${id} not found`);
    task.title = title;
    return task;
  }

  remove(id: string): void {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new NotFoundException(`Task with id ${id} not found`);
    this.tasks.splice(index, 1);
  }
}
