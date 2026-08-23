import { Module } from '@nestjs/common';

import { AiAgentService } from './ai-agent.service';
import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import { ChatbotController } from './chatbot.controller';
import { ChatbotKnowledgeService } from './chatbot.knowledge.service';
import { ChatbotLiveDomainHandlersService } from './chatbot.live-domain-handlers.service';
import { ChatbotOrchestratorService } from './chatbot.orchestrator.service';
import { ChatbotService } from './chatbot.service';

@Module({
  controllers: [ChatbotController],
  providers: [
    AiAgentService,
    ChatbotDomainRegistry,
    ChatbotKnowledgeService,
    ChatbotLiveDomainHandlersService,
    ChatbotOrchestratorService,
    ChatbotService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
