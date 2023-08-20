import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTaskDto, EditPositionTaskDto, EditTaskDto } from './dto';
import { TaskService } from './task.service';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateTaskDto) {
    const task = await this.taskService.create(data);
    return task;
  }

  @Get('/board/:boardId')
  async getAll(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.taskService.findAll(boardId);
  }

  @Get('/:id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return await this.taskService.findOne(id);
  }

  @Put('/positions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePositions(@Body() data: { tasks: Array<EditPositionTaskDto> }) {
    return await this.taskService.updatePositions(data.tasks);
  }

  @Put('/update/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: EditTaskDto,
  ) {
    return await this.taskService.update(id, data);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.taskService.delete(id);
  }
}
