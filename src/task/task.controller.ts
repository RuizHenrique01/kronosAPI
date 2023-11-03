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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
  StreamableFile,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { CreateTaskDto, EditPositionTaskDto, EditTaskDto } from './dto';
import { TaskService } from './task.service';
import { JwtGuard } from 'src/auth/guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

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

  @Post('/:id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 })],
      }),
    )
    file: Express.Multer.File,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.taskService.uploadFile(file, id);
  }

  @Get('/:id/upload/:name')
  async getUploadFile(
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('name') name: string,
  ): Promise<StreamableFile> {
    const file = await this.taskService.getUploadFile(id, name);
    res.set({
      'Content-Type': `application/${name
        .split('.')
        .slice(-1)[0]
        .toLowerCase()}`,
      'Content-Disposition': `attachment; filename="${name}"`,
    });
    return new StreamableFile(file);
  }

  @Delete('/:id/upload/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUploadFile(
    @Param('id', ParseIntPipe) id: number,
    @Param('name') name: string,
  ) {
    await this.taskService.removeUploadFile(id, name);
  }

  @Get('/:id/files')
  async getAllFile(@Param('id', ParseIntPipe) id: number) {
    const files = await this.taskService.getAllFiles(id);

    return files;
  }

  @Put('/:id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async completeTask(
    @Param('id', ParseIntPipe) id: number,
    @Query('isComplete', ParseBoolPipe) isComplete = true,
  ) {
    await this.taskService.completeTask(id, isComplete);
  }
}
