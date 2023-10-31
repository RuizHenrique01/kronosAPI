import { join } from 'path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto, EditPositionTaskDto, EditTaskDto } from './dto';
import { BOARD_ERROR, TASK_ERROR } from 'src/error';
import { UserService } from 'src/user/user.service';
import * as fs from 'fs';
import { BoardService } from 'src/board/board.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private boardService: BoardService,
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

  async uploadFile(file: Express.Multer.File, id: number) {
    const task = await this.findOne(id);

    const board = await this.boardService.findOne(task.boardId);

    const currentPath = process.cwd();
    const uploadPath = `${currentPath}/uploads`;
    const projectPath = `${uploadPath}/${board.projectId}`;
    const taskPath = `${projectPath}/${task.id}`;
    const fileNamePath = `uploads/${board.projectId}/${task.id}/${file.originalname}`;

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath);
    }

    if (!fs.existsSync(taskPath)) {
      fs.mkdirSync(taskPath);
    }

    try {
      fs.appendFile(fileNamePath, Buffer.from(file.buffer), (err) => {
        if (err) {
          console.log('UPLOAD ERROR: ', err);
          throw new Error(err.message);
        }
      });
    } catch (err) {
      throw new BadRequestException(TASK_ERROR.FAIL_TO_UPLOAD_FILE);
    }

    return file;
  }

  async getUploadFile(id: number, name: string) {
    const task = await this.findOne(id);

    const board = await this.boardService.findOne(task.boardId);

    const fileNamePath = `uploads/${board.projectId}/${task.id}/${name}`;

    if (!fs.existsSync(fileNamePath)) {
      throw new NotFoundException(TASK_ERROR.NOT_FOUND_FILE);
    }

    const file = fs.createReadStream(join(process.cwd(), fileNamePath));
    return file;
  }

  async removeUploadFile(id: number, name: string) {
    const task = await this.findOne(id);

    const board = await this.boardService.findOne(task.boardId);

    const fileNamePath = `uploads/${board.projectId}/${task.id}/${name}`;

    if (!fs.existsSync(fileNamePath)) {
      throw new NotFoundException(TASK_ERROR.NOT_FOUND_FILE);
    }

    fs.rmSync(join(process.cwd(), fileNamePath));
  }

  async getAllFiles(id: number) {
    const task = await this.findOne(id);

    const board = await this.boardService.findOne(task.boardId);

    const fileNamePath = `uploads/${board.projectId}/${task.id}`;

    if (!fs.existsSync(fileNamePath)) {
      throw new NotFoundException(TASK_ERROR.NOT_FOUND_FILE);
    }

    const files = fs.readdirSync(fileNamePath);

    const dataFiles = files.map((f) => {
      const fileName = f.split('.');

      return {
        name: f,
        type: fileName.splice(-1)[0],
      };
    });

    return dataFiles;
  }

  async completeTask(id: number) {
    const task = await this.findOne(id);
    await this.prisma.tasks.update({
      where: {
        id: task.id,
      },
      data: {
        dateConclusion: new Date(),
      },
    });
  }
}
