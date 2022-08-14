import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  ConflictException,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { jwtUser } from '../interface/jwt-user.interface';
import { UpdateMentorDatailDto } from '../dto/mentors/mentor-detail.dto';
import { Mentors } from '../entities/mentors.entity';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/role.guard';
import { MentorsService } from './service/mentors.service';
import { MentoringsService } from './service/mentorings.service';
import { UpdateMentoringDto } from '../dto/mentors/update-mentoring.dto';
import { MentoringLogs } from '../entities/mentoring-logs.entity';
import { MentorMentoringInfo } from '../interface/mentors/mentor-mentoring-info.interface';
import { SearchMentorsService } from './service/search-mentors.service';
import { MentorsList } from '../interface/mentors/mentors-list.interface';
import { JoinMentorDto } from '../dto/mentors/join-mentor-dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '../dto/pagination.dto';
import { EmailService, MailType } from '../email/service/email.service';

@Controller()
@ApiTags('mentors API')
export class MentorsController {
  constructor(
    private readonly mentorsService: MentorsService,
    private readonly mentoringsService: MentoringsService,
    private readonly searchMentorsService: SearchMentorsService,
    private readonly emailService: EmailService,
  ) {}

  @Get('mentorings')
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'getMentoringsLists get API',
    description: '멘토링 리스트 가져오는 api',
  })
  @ApiCreatedResponse({
    description: '멘토링 리스트 가져오기 성공',
    type: Promise<MentorMentoringInfo>,
  })
  async getMentoringsLists(
    @User() user: jwtUser,
  ): Promise<MentorMentoringInfo> {
    return await this.mentoringsService.getMentoringsLists(user);
  }

  @Get('simplelogs/:mentorIntraId')
  @UseGuards(JwtGuard)
  async getSimpleLogs(
    @Param('mentorIntraId') mentorIntraId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<[MentoringLogs[], number]> {
    return await this.mentoringsService.getSimpleLogsPagination(
      mentorIntraId,
      paginationDto,
    );
  }

  @Patch('mentorings')
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'setMeetingAt patch API',
    description: '멘토링 미팅일정 확정 api',
  })
  @ApiCreatedResponse({
    description: '멘토링로그 수정 성공',
    type: Promise<MentoringLogs>,
  })
  async setMeetingAt(@Body() body: UpdateMentoringDto): Promise<MentoringLogs> {
    try {
      const mentoringLoginfo = await this.mentoringsService.setMeetingAt(body);

      if (mentoringLoginfo) {
        if (mentoringLoginfo.status === '예정') {
          this.emailService.sendMessage(
            mentoringLoginfo.id,
            MailType.ApproveToCadet,
          );
        } else if (mentoringLoginfo.status === '취소') {
          this.emailService.sendMessage(
            mentoringLoginfo.id,
            MailType.CancelToCadet,
          );
        }
      }

      return mentoringLoginfo;
    } catch (err) {
      throw err;
    }
  }

  @Post()
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'updateMentorDetails post API',
    description: '멘토 상세정보입력 api',
  })
  @ApiCreatedResponse({
    description:
      '멘토 상세정보(introduction, isActive, markdownContent) 생성 성공',
    type: Promise<string>,
  })
  async updateMentorDetails(
    @User() user: jwtUser,
    @Body() body: UpdateMentorDatailDto,
  ) {
    return await this.mentorsService.updateMentorDetails(user.intraId, body);
  }

  @Post('join')
  @Roles('mentor')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'mentor join post API',
    description: '멘토 기본정보(name, availableTime, isActive) 입력 api',
  })
  @ApiCreatedResponse({
    description: '멘토 기본정보 생성 성공',
    type: Promise<void>,
  })
  join(@Body() body: JoinMentorDto, @User() user: jwtUser) {
    this.mentorsService.saveInfos(user.intraId, body);
  }

  @Get(':intraId')
  @Roles('mentor', 'cadet')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'getMentorDetails API',
    description: '멘토 세부정보(comments, mentoringLogs) 받아오는 api',
  })
  @ApiCreatedResponse({
    description: '멘토 세부정보 받아오기 성공',
    type: Promise<Mentors>,
  })
  async getMentorDetails(@Param('intraId') intraId: string): Promise<Mentors> {
    return await this.mentorsService.findMentorByIntraId(intraId);
  }

  @Get()
  @ApiOperation({
    summary: 'getMentors API',
    description: '멘토리스트 받아오는 api',
  })
  @ApiCreatedResponse({
    description: '멘토리스트 받아오기 성공',
    type: Promise<MentorsList>,
  })
  getMentors(
    @Query('categoryId') categoryId?: string,
    @Query('keywordId') keywordId?: string[],
    @Query('searchText') searchText?: string,
  ): Promise<MentorsList> {
    if (typeof keywordId === 'string') keywordId = [keywordId];
    if (typeof categoryId === 'object' || typeof searchText === 'object')
      throw new ConflictException('잘못된 입력이 들어왔습니다.');
    return this.searchMentorsService.getMentorList(
      categoryId,
      keywordId,
      searchText,
    );
  }
}
