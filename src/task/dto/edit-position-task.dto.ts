import { IsNumber } from 'class-validator';

export class EditPositionTaskDto {
  @IsNumber()
  id: number;
  @IsNumber()
  position: number;
  @IsNumber()
  boardId: number;
}
