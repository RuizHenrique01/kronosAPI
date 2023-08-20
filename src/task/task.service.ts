import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto, EditPositionTaskDto, EditTaskDto } from './dto';
import { BOARD_ERROR, TASK_ERROR } from 'src/error';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async create(data: CreateTaskDto) {
    if (data.ownerId) {
      await this.userService.findById(data.ownerId);
    }

    const boardExist = await this.prisma.boards.findUnique({
      where: {
        id: data.boardId,
      },
      include: {
        Tasks: true,
      },
    });

    if (!boardExist) {
      throw new NotFoundException(BOARD_ERROR.NOT_FOUND);
    }
    try {
      const task = await this.prisma.tasks.create({
        data: {
          ...data,
          position: boardExist.Tasks.length,
        },
      });

      return task;
    } catch (error) {
      throw new ForbiddenException(TASK_ERROR.FAIL_TO_CREATE);
    }
  }

  async findOne(id: number) {
    const task = await this.prisma.tasks.findUnique({
      where: {
        id: id,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(TASK_ERROR.NOT_FOUND);
    }

    return task;
  }

  findAll(boardId: number) {
    return this.prisma.tasks.findMany({
      where: {
        boardId: boardId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async update(id: number, data: EditTaskDto) {
    await this.findOne(id);

    if (data.ownerId) {
      await this.userService.findById(data.ownerId);
    }

    const task = await this.prisma.tasks.update({
      where: {
        id: id,
      },
      data: data,
    });
    return task;
  }

  async updatePositions(data: Array<EditPositionTaskDto>) {
    const promises = [];

    for (const task of data) {
      promises.push(
        await this.prisma.tasks.update({
          where: {
            id: task.id,
          },
          data: {
            position: task.position,
            boardId: task.boardId,
          },
        }),
      );
    }

    await Promise.all(promises);
  }

  async delete(id: number) {
    await this.findOne(id);
    return await this.prisma.tasks.delete({
      where: {
        id: id,
      },
    });
  }
}
