/**
 * Real Agent
 * LLM + Tools + Memory + Permissions + Execution
 */

import Groq from 'groq-sdk';
import { Logger } from './logger';
import { db } from './database';
import { toolRegistry, Tool } from './tools/registry';

const logger = new Logger('RealAgent');

export interface AgentContext {
  userAddress: string;
  conversationHistory: any[];
  userProfile: any;
  availableTools: Tool[];
}

export interface AgentResponse {
  message: string;
  toolsUsed: string[];
  requiresApproval: boolean;
  approvalId?: string;
  executionLogs: any[];
}

export class RealAgent {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
    logger.info('Real Agent initialized');
  }

  /**
   * Main agent loop
   */
  async process(userMessage: string, userAddress: string): Promise<AgentResponse> {
    logger.info('Processing message', { userAddress, message: userMessage.substring(0, 50) });

    try {
      // 1. Load context (memory)
      const context = await this.loadContext(userAddress);

      // 2. Save user message
      await db.saveMessage(userAddress, 'user', userMessage);

      // 3. Understand intent and plan actions
      const plan = await this.planActions(userMessage, context);

      // 4. Execute tools (with approval for high-risk)
      const executionResults = await this.executeTools(plan.tools, userAddress);

      // 5. Generate response
      const response = await this.generateResponse(
        userMessage,
        executionResults,
        context
      );

      // 6. Save assistant message
      await db.saveMessage(userAddress, 'assistant', response.message);

      return response;
    } catch (error: any) {
      logger.error('Agent processing error', error);
      throw error;
    }
  }

  /**
   * Load user context (memory)
   */
  private async loadContext(userAddress: string): Promise<AgentContext> {
    const [profile, history] = await Promise.all([
      db.getUserProfile(userAddress),
      db.getConversationHistory(userAddress, 10),
    ]);

    // Create default profile if doesn't exist
    if (!profile) {
      await db.createOrUpdateProfile(userAddress, {
        strategy: 'DCA',
        risk_profile: 'moderate',
      });
    }

    return {
      userAddress,
      conversationHistory: history,
      userProfile: profile || { strategy: 'DCA', risk_profile: 'moderate' },
      availableTools: toolRegistry.getAll(),
    };
  }

  /**
   * Plan which tools to use
   */
  private async planActions(userMessage: string, context: AgentContext) {
    const systemPrompt = this.buildPlanningPrompt(context);

    const completion = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const planText = completion.choices[0]?.message?.content || '{}';
    const plan = JSON.parse(planText);

    logger.info('Action plan created', { tools: plan.tools?.length || 0 });

    return plan;
  }

  /**
   * Execute tools with approval system
   */
  private async executeTools(tools: any[], userAddress: string) {
    const results = [];

    for (const toolCall of tools || []) {
      const tool = toolRegistry.get(toolCall.name);
      if (!tool) {
        logger.warn(`Tool not found: ${toolCall.name}`);
        continue;
      }

      // Check if requires approval
      if (tool.riskLevel === 'high') {
        // Create approval request
        const approval = await db.createApproval({
          address: userAddress,
          tool_name: tool.name,
          parameters: toolCall.parameters,
          risk_level: 'high',
          reasoning: toolCall.reasoning,
          expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });

        results.push({
          tool: tool.name,
          status: 'pending_approval',
          approvalId: approval.id,
          message: 'Requires user approval',
        });

        // Log pending execution
        await db.logExecution({
          address: userAddress,
          tool_name: tool.name,
          parameters: toolCall.parameters,
          status: 'pending',
          risk_level: 'high',
        });

        continue;
      }

      // Execute low/medium risk tools immediately
      try {
        const result = await toolRegistry.execute(
          tool.name,
          toolCall.parameters,
          { userAddress }
        );

        results.push({
          tool: tool.name,
          status: 'success',
          result,
        });

        // Log successful execution
        await db.logExecution({
          address: userAddress,
          tool_name: tool.name,
          parameters: toolCall.parameters,
          result,
          status: 'success',
          risk_level: tool.riskLevel,
        });
      } catch (error: any) {
        logger.error(`Tool execution failed: ${tool.name}`, error);

        results.push({
          tool: tool.name,
          status: 'failed',
          error: error.message,
        });

        // Log failed execution
        await db.logExecution({
          address: userAddress,
          tool_name: tool.name,
          parameters: toolCall.parameters,
          status: 'failed',
          error: error.message,
          risk_level: tool.riskLevel,
        });
      }
    }

    return results;
  }

  /**
   * Generate final response
   */
  private async generateResponse(
    userMessage: string,
    executionResults: any[],
    context: AgentContext
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildResponsePrompt(context);
    const resultsText = JSON.stringify(executionResults, null, 2);

    const completion = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `User message: ${userMessage}\n\nTool execution results:\n${resultsText}\n\nGenerate a helpful response.`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const message = completion.choices[0]?.message?.content || 'I encountered an error processing your request.';

    const requiresApproval = executionResults.some(r => r.status === 'pending_approval');
    const approvalId = executionResults.find(r => r.approvalId)?.approvalId;

    return {
      message,
      toolsUsed: executionResults.map(r => r.tool),
      requiresApproval,
      approvalId,
      executionLogs: executionResults,
    };
  }

  /**
   * Build planning prompt
   */
  private buildPlanningPrompt(context: AgentContext): string {
    const toolsDescription = context.availableTools
      .map(
        t =>
          `- ${t.name} (${t.riskLevel}): ${t.description}\n  Parameters: ${t.parameters.map(p => `${p.name} (${p.type})`).join(', ')}`
      )
      .join('\n');

    return `You are Tenma, an AI trading agent with real blockchain capabilities.

User Profile:
- Address: ${context.userAddress}
- Strategy: ${context.userProfile.strategy}
- Risk Profile: ${context.userProfile.risk_profile}

Available Tools:
${toolsDescription}

Your task: Analyze the user's message and decide which tools to use.

IMPORTANT: You MUST use tools to answer questions! Examples:
- "What is my balance?" → use get_balance tool with address parameter
- "What's the price?" → use get_price tool
- "Buy 0.5 A0GI" → use buy_token with token="A0GI", amount="0.5" (purchasing tokens)
- "Send 1 A0GI to 0x..." → use send_transaction with to="0x...", amount="1"

IMPORTANT: Swapping vs Buying:
- "Buy X A0GI" = Purchase tokens → use buy_token tool
- "Swap X to Y" = Exchange tokens → Tell user to use Intent Cross-Chain page
- If user asks to swap tokens, respond: "For token swaps, please use the Intent Cross-Chain page where you can swap between different tokens and chains."

Response format (JSON):
{
  "intent": "brief description of what user wants",
  "tools": [
    {
      "name": "tool_name",
      "parameters": { "param1": "value1", "param2": "value2" },
      "reasoning": "why this tool is needed"
    }
  ]
}

Rules:
1. ALWAYS use tools to get real data - never make up information
2. When user says "Buy X A0GI", use buy_token tool (purchasing tokens)
3. When user asks to "Swap X to Y", redirect them to Intent Cross-Chain page (NOT available in AI Chat)
4. Use low-risk tools (get_balance, get_price, get_transaction) freely
5. High-risk tools (buy_token, send_transaction) will require user approval
6. Always provide specific parameter values, not placeholders
7. If user just says "hi" or greets, use get_balance to show their balance
8. Be conservative with user funds
9. AI Chat is for: balance checks, price queries, buying tokens, sending transactions
10. Intent Cross-Chain is for: swapping tokens, cross-chain bridges`;
  }

  /**
   * Build response prompt
   */
  private buildResponsePrompt(context: AgentContext): string {
    return `You are Tenma, an AI trading agent. Generate a helpful response based on tool execution results.

User Profile:
- Strategy: ${context.userProfile.strategy}
- Risk Profile: ${context.userProfile.risk_profile}

Guidelines:
1. Be concise and actionable (2-3 sentences)
2. If tools succeeded, explain what was done
3. If approval needed, clearly explain what will happen
4. If tools failed, explain why and suggest alternatives
5. Use emojis sparingly (1-2 max)
6. Always mention transaction hashes if available
7. For pending approvals, explain the approval process

Keep responses professional but friendly.`;
  }

  /**
   * Execute approved action
   */
  async executeApprovedAction(approvalId: string, userAddress: string) {
    // Get approval details
    const approvals = await db.getPendingApprovals(userAddress);
    const approval = approvals.find(a => a.id === approvalId);

    if (!approval) {
      throw new Error('Approval not found');
    }

    if (approval.status !== 'pending') {
      throw new Error('Approval already processed');
    }

    // Update approval status
    await db.updateApprovalStatus(approvalId, 'approved');

    // Execute the tool with approved flag
    try {
      const result = await toolRegistry.execute(
        approval.tool_name,
        approval.parameters,
        { userAddress, approved: true } // Pass approved flag
      );

      // Log successful execution
      await db.logExecution({
        address: userAddress,
        tool_name: approval.tool_name,
        parameters: approval.parameters,
        result,
        status: 'success',
        risk_level: 'high',
        approved_by: userAddress,
      });

      // Return the tool result directly (not wrapped)
      return result;
    } catch (error: any) {
      // Log failed execution
      await db.logExecution({
        address: userAddress,
        tool_name: approval.tool_name,
        parameters: approval.parameters,
        status: 'failed',
        error: error.message,
        risk_level: 'high',
        approved_by: userAddress,
      });

      throw error;
    }
  }
}

export const realAgent = new RealAgent();
