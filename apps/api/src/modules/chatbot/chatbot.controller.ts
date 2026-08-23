import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';
import type { Role } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import {
  GetChatbotSummaryDto,
  QueryChatbotDto,
  UpsertKnowledgeDocumentDto,
} from './dto/chatbot.dto';
import { ChatbotService } from './chatbot.service';

@ApiTags('Chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('query')
  @ApiOperation({ summary: 'Query internal chatbot (orchestrated live data + knowledge)' })
  query(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: QueryChatbotDto,
    @Headers('authorization') authorization: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.chatbotService.query(userId, role, dto, authorization, requestId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List chatbot sessions for current user' })
  sessions(@CurrentUser('id') userId: string) {
    return this.chatbotService.listSessions(userId);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Get chatbot messages by session id' })
  messages(@CurrentUser('id') userId: string, @Param('id') sessionId: string) {
    return this.chatbotService.getMessages(userId, sessionId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get role-aware chatbot summary without creating a chat turn' })
  summary(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: GetChatbotSummaryDto,
  ) {
    return this.chatbotService.getSummary(userId, role, query.scope ?? 'today');
  }

  @Get('capabilities')
  @ApiOperation({ summary: 'Get chatbot capabilities and quick prompts for current role' })
  capabilities(@CurrentUser('role') role: Role) {
    return this.chatbotService.getCapabilities(role);
  }

  @Get('proposals/:id')
  @ApiOperation({ summary: 'Get an AI agent proposal for the current user' })
  getProposal(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) proposalId: string,
    @Headers('authorization') authorization: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.chatbotService.getProposal(userId, proposalId, authorization, requestId);
  }

  @Post('proposals/:id/confirm')
  @ApiOperation({ summary: 'Confirm an AI agent proposal for the current user' })
  confirmProposal(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) proposalId: string,
    @Headers('authorization') authorization: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.chatbotService.confirmProposal(userId, proposalId, authorization, requestId);
  }

  @Post('proposals/:id/reject')
  @ApiOperation({ summary: 'Reject an AI agent proposal for the current user' })
  rejectProposal(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) proposalId: string,
    @Headers('authorization') authorization: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.chatbotService.rejectProposal(userId, proposalId, authorization, requestId);
  }

  @Post('knowledge')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Upsert knowledge document for internal retrieval' })
  upsertKnowledge(@Body() dto: UpsertKnowledgeDocumentDto) {
    return this.chatbotService.upsertKnowledgeDocument(dto);
  }

  @Post('knowledge/sync')
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Sync built-in knowledge documents from chatbot domains' })
  syncKnowledge() {
    return this.chatbotService.syncKnowledgeDocuments();
  }
}
