import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;
}
