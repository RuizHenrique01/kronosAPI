import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { UserModule } from 'src/user/user.module';
import { BoardModule } from 'src/board/board.module';

@Module({
  imports: [UserModule, BoardModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
