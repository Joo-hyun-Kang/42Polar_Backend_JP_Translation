import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCadetDto } from 'src/v1/dto/create-cadet.dto';
import { Cadets } from 'src/v1/entities/cadets.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CadetsService {
  constructor(
    @InjectRepository(Cadets) private cadetsRepository: Repository<Cadets>,
  ) {}

  async createUser(user: CreateCadetDto) {
    const createdUser = await this.cadetsRepository.create(user);
    await this.cadetsRepository.save(createdUser);
    return { id: createdUser.id, intraId: createdUser.intraId, role: 'cadet' };
  }

  async findByIntra(intraId: string) {
    const foundUser = await this.cadetsRepository.findOneBy({ intraId });
    return { id: foundUser?.id, intraId: foundUser?.intraId, role: 'cadet' };
  }
}
