import {
  Body,
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { JwtUser } from '../interface/jwt-user.interface';
import { UpdateMentorDatailDto } from '../dto/mentors/mentor-detail.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/role.guard';
import { MentorsService } from './service/mentors.service';
import { MentoringsService } from './service/mentorings.service';
import { JoinMentorDto } from '../dto/mentors/join-mentor-dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '../dto/pagination.dto';
import { MentoringInfoDto } from '../dto/mentors/mentoring-info.dto';
import { LogPaginationDto } from '../dto/mentoring-logs/log-pagination.dto';
import { MentorDto } from '../dto/mentors/mentor.dto';

@Controller()
@ApiTags('mentors API')
export class MentorsController {
  constructor(
    private readonly mentorsService: MentorsService,
    private readonly mentoringsService: MentoringsService,
  ) {}

  @Get('mentorings')
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get mentoring logs',
    description: '로그인된 멘토의 멘토링 로그와 인트라 아이디를 반환합니다.',
  })
  @ApiQuery({
    name: 'take',
    type: Number,
    description: '한 페이지에 띄울 멘토링 로그 정보의 수',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: '선택한 페이지(1페이지, 2페이지, ...)',
  })
  @ApiCreatedResponse({
    description: '멘토 인트라 아이디, 멘토링 로그',
    type: MentoringInfoDto,
  })
  async getMentoringsLists(
    @User() user: JwtUser,
    @Query() pagination: PaginationDto,
  ): Promise<MentoringInfoDto> {
    return await this.mentoringsService.getMentoringsLists(
      user.intraId,
      pagination,
    );
  }

  @Get('simplelogs/:mentorIntraId')
  @ApiOperation({
    summary: 'Get mentoring simple log',
    description: '멘토링 로그 pagination',
  })
  @ApiQuery({
    name: 'take',
    type: Number,
    description: '한 페이지에 띄울 멘토링 로그 정보의 수',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: '선택한 페이지(1페이지, 2페이지, ...)',
  })
  @ApiCreatedResponse({
    description: '멘토링 로그 정보 심플 버전의 배열',
    type: LogPaginationDto,
  })
  async getSimpleLogs(
    @Param('mentorIntraId') mentorIntraId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<LogPaginationDto> {
    const result = await this.mentoringsService.getSimpleLogsPagination(
      mentorIntraId,
      paginationDto,
    );
    return { logs: result[0], total: result[1] };
  }

  @Patch('join')
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Post join mentor',
    description:
      '멘토 필수정보(이름, 이메일, 슬랙아이디, 가능시간, 멘토링 가능 상태)를 받아서 저장합니다.',
  })
  join(@Body() body: JoinMentorDto, @User() user: JwtUser) {
    return this.mentorsService.updateMentorDetails(user.intraId, body);
  }

  @Patch(':intraId')
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update mentor details',
    description: '멘토 정보를 수정합니다.',
  })
  async updateMentorDetails(
    @User() user: JwtUser,
    @Param('intraId') intraId: string,
    @Body() body: UpdateMentorDatailDto,
  ): Promise<void> {
    if (user.intraId !== intraId) {
      throw new BadRequestException('수정 권한이 없습니다.');
    }
    return await this.mentorsService.updateMentorDetails(user.intraId, body);
  }

  @Get(':intraId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get mentor details',
    description: '멘토에 대한 모든 정보를 반환합니다.',
  })
  @ApiCreatedResponse({
    description: '멘토 정보',
    type: MentorDto,
  })
  async getMentorDetails(
    @Param('intraId') intraId: string,
  ): Promise<MentorDto> {
    return await this.mentorsService.findMentorByIntraId(intraId);
  }
}
