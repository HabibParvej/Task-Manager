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
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  remove(id: string): void {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    this.tasks.splice(index, 1);
  }
}
