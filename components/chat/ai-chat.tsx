'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Markdown } from '@/components/ui/markdown';
import { useQuickBaseSimple } from '@/hooks/use-quickbase-simple';
import { Send, Loader2, Bot, User, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
}

// Helper function to format currency
const formatCurrency = (value: any): string => {
  if (!value && value !== 0) return 'N/A';
  const num = typeof value === 'object' ? value.value : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
};

// Helper function to format percentage
const formatPercent = (value: any): string => {
  if (!value && value !== 0) return 'N/A';
  const num = typeof value === 'object' ? value.value : value;
  // Check if the value is already a percentage (between 0 and 100) or a decimal
  if (Math.abs(num) <= 1) {
    // Decimal format, convert to percentage
    return `${(num * 100).toFixed(2)}%`;
  } else if (Math.abs(num) > 1000) {
    // Likely an error in data, show as is with warning
    return `${num.toFixed(2)}% (data error?)`;
  } else {
    // Already in percentage format
    return `${num.toFixed(2)}%`;
  }
};

export function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your CMS Controls Quickbase AI Agent.I can help you explore and manage your QuickBase data using natural language. Try asking me to "show all tables" or "tell me about my QuickBase apps". I can also provide detailed financial analysis - just ask me anything in natural language!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { callTool } = useQuickBaseSimple();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper function to check if message should be collapsible
  const shouldBeCollapsible = (content: string): boolean => {
    const lines = content.split('\n');
    return lines.length > 3 || content.length > 500;
  };

  // Helper function to get preview of message
  const getMessagePreview = (content: string): string => {
    const lines = content.split('\n');
    if (lines.length <= 3) return content;
    return lines.slice(0, 3).join('\n') + '...';
  };

  // Toggle message expansion
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const addMessage = (role: 'user' | 'assistant', content: string, data?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      data,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const processWithAI = async (userMessage: string, isFollowUp: boolean = false) => {
    try {
      // Ask Claude what to do, including any previous tool results for context
      const aiResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
            data: m.data // Include tool results in context
          })),
          isFollowUp: isFollowUp
        })
      });

      const aiResult = await aiResponse.json();
      console.log('AI Response:', aiResult);
      console.log('AI Response type:', typeof aiResult);
      console.log('AI Response action:', aiResult?.action);
      console.log('AI Response full:', JSON.stringify(aiResult));

      // Handle the AI's decision
      if (aiResult && aiResult.action === 'multi_tool_call') {
        // Claude wants to make multiple tool calls
        addMessage('assistant', aiResult.overall_explanation || 'Let me gather comprehensive information for you...');
        
        const allResults = [];
        for (const call of aiResult.calls) {
          try {
            console.log(`Executing tool: ${call.tool}`, call.params);
            const rawResult = await callTool(call.tool, call.params);
            allResults.push({
              tool: call.tool,
              explanation: call.explanation,
              result: rawResult?.result || rawResult
            });
          } catch (error) {
            console.error(`Error in tool ${call.tool}:`, error);
            allResults.push({
              tool: call.tool,
              explanation: call.explanation,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        // Send all results back to Claude for analysis and summary
        const summaryRequest = {
          message: `Based on the data I just gathered from ${allResults.length} different sources, please provide a comprehensive analytical summary following the format in your instructions. Here's the raw data: ${JSON.stringify(allResults)}`,
          context: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        };
        
        try {
          const summaryResponse = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(summaryRequest)
          });
          
          const summaryResult = await summaryResponse.json();
          
          if (summaryResult.action === 'response' && summaryResult.message) {
            // Claude has provided the analytical summary
            addMessage('assistant', summaryResult.message, allResults);
            return; // Exit early to avoid the raw data formatting below
          }
        } catch (error) {
          console.error('Error getting summary from AI:', error);
        }
        
        // Fallback to formatting combined results if summary fails
        let responseMessage = 'Here\'s the information I found (raw data - summary generation failed):\n\n';
        allResults.forEach((result, index) => {
          responseMessage += `**${result.explanation}**\n`;
          if (result.error) {
            responseMessage += `❌ Error: ${result.error}\n\n`;
          } else {
            // Format based on the tool type
            if (result.tool === 'query_records' && result.result?.records) {
              const records = result.result.records;
              const totalRecords = result.result?.totalRecords || records.length;
              const metadata = result.result?.metadata;
              
              if (records.length > 0) {
                // Check if this is the Projects table based on field IDs or table structure
                const firstRecord = records[0];
                const isProjectsTable = firstRecord['6'] || firstRecord['12'] || firstRecord['352'] || firstRecord['374'];
                
                if (isProjectsTable) {
                  // Projects table - show project-specific fields with financial data
                  responseMessage += `Found ${totalRecords} project${totalRecords > 1 ? 's' : ''}:\n\n`;
                  records.slice(0, 10).forEach((record: any, recordIndex: number) => {
                    // Handle nested value structure from QuickBase API
                    const projectNumber = record['6']?.value || record['6'] || 'N/A';
                    const projectName = record['12']?.value || record['12'] || ''; 
                    const opportunityTitle = record['8']?.value || record['8'] || '';
                    const siteName = record['15']?.value || record['15'] || '';
                    const projectManager = record['4']?.value?.name || record['4']?.value || record['4'] || 'N/A';
                    
                    responseMessage += `${recordIndex + 1}. **${projectNumber}**`;
                    if (projectName) {
                      responseMessage += ` - ${projectName}`;
                    } else if (opportunityTitle) {
                      responseMessage += ` - ${opportunityTitle}`;
                    }
                    responseMessage += '\n';
                    
                    // Basic info
                    if (siteName) {
                      responseMessage += `   Site: ${siteName}\n`;
                    }
                    responseMessage += `   Manager: ${projectManager}\n`;
                    
                    // Financial information if present
                    const hasFinancialData = record['352'] || record['374'] || record['376'] || record['115'];
                    if (hasFinancialData) {
                      responseMessage += '\n   **Financial Summary:**\n';
                      
                      // Budget & Estimates
                      if (record['352'] || record['353']) {
                        responseMessage += '   *Budget:*\n';
                        if (record['352']) responseMessage += `   - Total Estimated Cost: ${formatCurrency(record['352'])}\n`;
                        if (record['353']) responseMessage += `   - Total Budget: ${formatCurrency(record['353'])}\n`;
                        if (record['354']) responseMessage += `   - Budget Variance: ${formatCurrency(record['354'])}\n`;
                      }
                      
                      // Actual Costs & Revenue
                      if (record['374'] || record['376']) {
                        responseMessage += '   *Actuals:*\n';
                        if (record['374']) responseMessage += `   - Total Actual Cost: ${formatCurrency(record['374'])}\n`;
                        if (record['376']) responseMessage += `   - Total Revenue: ${formatCurrency(record['376'])}\n`;
                      }
                      
                      // Profit Metrics
                      if (record['115'] || record['116'] || record['117']) {
                        responseMessage += '   *Profitability:*\n';
                        if (record['115']) responseMessage += `   - Gross Profit: ${formatCurrency(record['115'])}\n`;
                        if (record['116']) responseMessage += `   - Gross Profit Margin: ${formatPercent(record['116'])}\n`;
                        if (record['117']) responseMessage += `   - Net Profit: ${formatCurrency(record['117'])}\n`;
                      }
                      
                      // Cost Breakdown if available
                      if (record['106'] || record['107'] || record['108'] || record['109']) {
                        responseMessage += '   *Cost Breakdown:*\n';
                        if (record['106']) responseMessage += `   - Labor: ${formatCurrency(record['106'])}\n`;
                        if (record['107']) responseMessage += `   - Materials: ${formatCurrency(record['107'])}\n`;
                        if (record['108']) responseMessage += `   - Equipment: ${formatCurrency(record['108'])}\n`;
                        if (record['109']) responseMessage += `   - Subcontractors: ${formatCurrency(record['109'])}\n`;
                      }
                      
                      // Progress
                      if (record['159']) {
                        responseMessage += `   *Progress:* ${formatPercent(record['159'])} Complete\n`;
                      }
                    }
                    
                    responseMessage += '\n';
                  });
                } else if (metadata?.tableId === 'bthxdetqc' || firstRecord['107'] || firstRecord['111'] || firstRecord['131']) {
                  // Project Financials table
                  responseMessage += `Found ${totalRecords} financial transaction${totalRecords > 1 ? 's' : ''}:\n\n`;
                  records.slice(0, 10).forEach((record: any, recordIndex: number) => {
                    const projectNumber = record['6']?.value || record['6'] || 'N/A';
                    const projectName = record['38']?.value || record['38'] || record['34']?.value || record['34'] || '';
                    const budgetType = record['41']?.value || record['41'] || '';
                    const transactionDate = record['129']?.value || record['129'] || '';
                    const totalCost = record['107']?.value || record['107'];
                    const totalRev = record['111']?.value || record['111'];
                    const actualRev = record['131']?.value || record['131'];
                    const hours = record['132']?.value || record['132'];
                    
                    responseMessage += `${recordIndex + 1}. **Transaction #${record['3']?.value || record['3'] || recordIndex + 1}**\n`;
                    responseMessage += `   Project: ${projectNumber}`;
                    if (projectName) responseMessage += ` - ${projectName}`;
                    responseMessage += '\n';
                    
                    if (budgetType) responseMessage += `   Type: ${budgetType}\n`;
                    if (transactionDate) responseMessage += `   Transaction Date: ${transactionDate}\n`;
                    
                    responseMessage += '   **Financial Details:**\n';
                    if (totalCost) responseMessage += `   - Total Cost: ${formatCurrency(totalCost)}\n`;
                    if (totalRev) responseMessage += `   - Total Revenue: ${formatCurrency(totalRev)}\n`;
                    if (actualRev) responseMessage += `   - Actual Revenue: ${formatCurrency(actualRev)}\n`;
                    if (hours) responseMessage += `   - Hours: ${hours}\n`;
                    
                    // Calculate margin if we have revenue and cost
                    if (totalRev && totalCost) {
                      const margin = (totalRev.value || totalRev) - (totalCost.value || totalCost);
                      const marginPercent = ((margin / (totalRev.value || totalRev)) * 100).toFixed(2);
                      responseMessage += `   - Margin: ${formatCurrency(margin)} (${marginPercent}%)\n`;
                    }
                    
                    responseMessage += '\n';
                  });
                } else if (metadata?.tableId === 'bt4429qk7' || firstRecord['15'] || firstRecord['16']) {
                  // Invoicing table
                  responseMessage += `Found ${totalRecords} invoice${totalRecords > 1 ? 's' : ''}:\n\n`;
                  records.slice(0, 10).forEach((record: any, recordIndex: number) => {
                    const invoiceId = record['3']?.value || record['3'] || '';
                    const invoiceName = record['11']?.value || record['11'] || '';
                    const projectNumber = record['15']?.value || record['15'] || '';
                    const projectName = record['16']?.value || record['16'] || '';
                    const invoiceAmount = record['6']?.value || record['6'];
                    const invoiceStatus = record['12']?.value || record['12'] || '';
                    const statusDate = record['13']?.value || record['13'] || '';
                    const invoicePercent = record['7']?.value || record['7'];
                    const runningPercent = record['9']?.value || record['9'];
                    
                    responseMessage += `${recordIndex + 1}. **Invoice #${invoiceId || invoiceName || recordIndex + 1}**\n`;
                    if (projectNumber || projectName) {
                      responseMessage += `   Project: ${projectNumber}`;
                      if (projectName) responseMessage += ` - ${projectName}`;
                      responseMessage += '\n';
                    }
                    
                    responseMessage += `   Amount: ${formatCurrency(invoiceAmount)}\n`;
                    responseMessage += `   Status: **${invoiceStatus}**\n`;
                    if (statusDate) responseMessage += `   Status Date: ${statusDate}\n`;
                    if (invoicePercent) responseMessage += `   Invoice %: ${formatPercent(invoicePercent)}\n`;
                    if (runningPercent) responseMessage += `   Running Total %: ${formatPercent(runningPercent)}\n`;
                    
                    // Status indicators
                    if (invoiceStatus?.toLowerCase().includes('submitted')) {
                      responseMessage += `   ✅ Invoice submitted for payment\n`;
                    } else if (invoiceStatus?.toLowerCase().includes('pending')) {
                      responseMessage += `   ⏳ Invoice pending submission\n`;
                    } else if (invoiceStatus?.toLowerCase().includes('paid')) {
                      responseMessage += `   💰 Invoice paid\n`;
                    }
                    
                    responseMessage += '\n';
                  });
                } else if (metadata?.tableId === 'bubhyb7kn') {
                  // Work Requests table
                  responseMessage += `Found ${totalRecords} work request${totalRecords > 1 ? 's' : ''}:\n\n`;
                  records.slice(0, 10).forEach((record: any, recordIndex: number) => {
                    const projectNumber = record['101']?.value || record['101'] || '';
                    const workRequestName = record['103']?.value || record['103'] || '';
                    
                    responseMessage += `${recordIndex + 1}. **${workRequestName || `Work Request ${recordIndex + 1}`}**\n`;
                    if (projectNumber) responseMessage += `   Project/Estimation: ${projectNumber}\n`;
                    
                    // Show all other fields
                    Object.entries(record).forEach(([key, value]: [string, any]) => {
                      if (key !== '101' && key !== '103') {
                        const displayValue = value?.value !== undefined ? value.value : value;
                        if (displayValue !== null && displayValue !== undefined && displayValue !== '[object Object]') {
                          responseMessage += `   Field ${key}: ${displayValue}\n`;
                        }
                      }
                    });
                    responseMessage += '\n';
                  });
                } else if (metadata?.tableId === 'btg34f8x7' || metadata?.tableId === 'btg33cmzx') {
                  // Materials table
                  responseMessage += `Found ${totalRecords} material${totalRecords > 1 ? 's' : ''}:\n\n`;
                  records.slice(0, 10).forEach((record: any, recordIndex: number) => {
                    const itemNumber = record['18']?.value || record['18'] || '';
                    const manufacturerPart = record['8']?.value || record['8'] || '';
                    
                    responseMessage += `${recordIndex + 1}. **${itemNumber || manufacturerPart || `Material ${recordIndex + 1}`}**\n`;
                    
                    // Show all fields
                    Object.entries(record).forEach(([key, value]: [string, any]) => {
                      const displayValue = value?.value !== undefined ? value.value : value;
                      if (displayValue !== null && displayValue !== undefined && displayValue !== '[object Object]') {
                        responseMessage += `   Field ${key}: ${displayValue}\n`;
                      }
                    });
                    responseMessage += '\n';
                  });
                } else {
                  // Generic table display for unknown tables
                  responseMessage += `Found ${records.length} record${records.length > 1 ? 's' : ''}:\n\n`;
                  records.slice(0, 10).forEach((record: any, recordIndex: number) => {
                    responseMessage += `${recordIndex + 1}. `;
                    // Try to find a name or title field
                    const displayName = record.name || record.title || record.label || `Record ${recordIndex + 1}`;
                    responseMessage += `**${displayName}**\n`;
                    
                    // Show all fields with proper formatting
                    Object.entries(record).forEach(([key, value]: [string, any]) => {
                      if (key !== 'id' && key !== 'name' && key !== 'title' && key !== 'label') {
                        // Handle nested value structure
                        const displayValue = value?.value !== undefined ? value.value : value;
                        if (displayValue !== null && displayValue !== undefined && displayValue !== '[object Object]') {
                          responseMessage += `   Field ${key}: ${displayValue}\n`;
                        }
                      }
                    });
                    responseMessage += '\n';
                  });
                }
                
                if (records.length > 10) {
                  responseMessage += `... and ${records.length - 10} more records\n`;
                }
              } else {
                responseMessage += 'No records found matching your query.\n';
              }
            } else if (result.tool === 'list_tables') {
              const tables = result.result?.tables || [];
              if (tables.length > 0) {
                responseMessage += `Found ${tables.length} tables:\n`;
                tables.forEach((table: any, tableIndex: number) => {
                  responseMessage += `${tableIndex + 1}. **${table.name}** (ID: ${table.id})`;
                  if (table.description) {
                    responseMessage += `\n   ${table.description}`;
                  }
                  responseMessage += '\n';
                });
              } else {
                responseMessage += 'No tables found.\n';
              }
            } else if (result.tool === 'get_table_fields') {
              const fields = result.result?.fields || [];
              if (fields.length > 0) {
                responseMessage += `Found ${fields.length} fields:\n`;
                fields.slice(0, 10).forEach((field: any, fieldIndex: number) => {
                  responseMessage += `${fieldIndex + 1}. **${field.label}** (${field.fieldType || field.field_type})`;
                  if (field.required) {
                    responseMessage += ' - Required';
                  }
                  responseMessage += '\n';
                });
                if (fields.length > 10) {
                  responseMessage += `... and ${fields.length - 10} more fields\n`;
                }
              } else {
                responseMessage += 'No field information available.\n';
              }
            }
            responseMessage += '\n';
          }
        });
        
        addMessage('assistant', responseMessage, allResults);
        
      } else if (aiResult && aiResult.action === 'tool_call') {
        // Single tool call (original logic)
        addMessage('assistant', aiResult.explanation || `Let me ${aiResult.tool.replace(/_/g, ' ')} for you...`);
        
        try {
          const rawResult = await callTool(aiResult.tool, aiResult.params);
          console.log('Raw tool result received:', rawResult);
          
          // Check for errors first
          if (rawResult?.error || rawResult?.result?.isError) {
            const errorMessage = rawResult?.error?.message || rawResult?.result?.text || 'An error occurred';
            addMessage('assistant', `I encountered an error: ${errorMessage}`);
            return;
          }
          
          // Extract the actual result from nested structure
          const toolResult = rawResult?.result || rawResult;
          console.log('Extracted tool result:', toolResult);
          
          // Format the result nicely
          let responseMessage = '';
          if (aiResult.tool === 'list_tables') {
            const tables = toolResult?.tables || [];
            if (tables.length > 0) {
              responseMessage = `I found ${tables.length} tables in your QuickBase app:\n\n`;
              tables.forEach((table: any, index: number) => {
                responseMessage += `${index + 1}. **${table.name}** (ID: ${table.id})`;
                if (table.description) {
                  responseMessage += `\n   ${table.description}`;
                }
                responseMessage += '\n';
              });
            } else {
              responseMessage = 'No tables found in the current app.';
            }
          } else if (aiResult.tool === 'test_connection') {
            responseMessage = '✅ Successfully connected to QuickBase!\n\n';
            if (toolResult) {
              responseMessage += `Server: ${toolResult.serverInfo?.name || 'QuickBase MCP'}\n`;
              responseMessage += `Version: ${toolResult.serverInfo?.version || 'Unknown'}`;
            }
          } else if (aiResult.tool === 'get_table_fields') {
            const fields = toolResult?.fields || [];
            if (fields.length > 0) {
              // Get table name from params or use generic name
              const tableId = aiResult.params?.table_id || aiResult.params?.tableId;
              const tableNames: Record<string, string> = {
                'bthajfmdr': 'Projects',
                'btfkvak3j': 'Opportunities', 
                'btfkvawyz': 'Estimator',
                'btg34af6d': 'Assets',
                'btfkvs7r3': 'Contacts',
                'btfkvtjqx': 'Assignments',
                'btfkxdqtj': 'Companies'
              };
              const tableName = tableNames[tableId] || toolResult.tableName || 'Table';
              
              responseMessage = `The **${tableName}** table has ${fields.length} fields:\n\n`;
              fields.slice(0, 20).forEach((field: any, index: number) => {
                responseMessage += `${index + 1}. **${field.label}** (${field.fieldType || field.field_type})`;
                if (field.required) {
                  responseMessage += ' - Required';
                }
                responseMessage += '\n';
                if (field.fieldHelp) {
                  responseMessage += `   ${field.fieldHelp}\n`;
                }
              });
              if (fields.length > 20) {
                responseMessage += `\n... and ${fields.length - 20} more fields`;
              }
            } else {
              responseMessage = 'No field information available for this table.';
            }
          } else if (aiResult.tool === 'query_records') {
            const records = toolResult?.records || toolResult?.data || [];
            const totalRecords = toolResult?.totalRecords || records.length;
            
            if (records.length > 0) {
              // Check if this is the Projects table based on field IDs
              const tableId = aiResult.params?.table_id;
              if (tableId === 'bthajfmdr') {
                // Projects table - show project-specific fields
                responseMessage = `Found ${totalRecords} project${totalRecords > 1 ? 's' : ''}:\n\n`;
                records.slice(0, 10).forEach((record: any, index: number) => {
                  // Handle nested value structure from QuickBase API
                  const projectNumber = record['6']?.value || record['6'] || 'N/A';
                  const projectName = record['12']?.value || record['12'] || ''; 
                  const opportunityTitle = record['8']?.value || record['8'] || '';
                  const siteName = record['15']?.value || record['15'] || '';
                  const recordId = record['3']?.value || record['3'] || 'N/A';
                  const projectManager = record['4']?.value?.name || record['4']?.value || record['4'] || 'N/A';
                  
                  responseMessage += `${index + 1}. **${projectNumber}**`;
                  if (projectName) {
                    responseMessage += ` - ${projectName}`;
                  } else if (opportunityTitle) {
                    responseMessage += ` - ${opportunityTitle}`;
                  }
                  responseMessage += '\n';
                  
                  // Basic info
                  if (siteName) {
                    responseMessage += `   Site: ${siteName}\n`;
                  }
                  responseMessage += `   Manager: ${projectManager}\n`;
                  
                  // Financial information if present
                  const hasFinancialData = record['352'] || record['374'] || record['376'] || record['115'];
                  if (hasFinancialData) {
                    responseMessage += '\n   **Financial Summary:**\n';
                    
                    // Budget Information (Costs)
                    if (record['352'] || record['353'] || record['354'] || record['355']) {
                      responseMessage += '   *Budget Costs:*\n';
                      if (record['352']) responseMessage += `   - Materials: ${formatCurrency(record['352'])}\n`;
                      if (record['353']) responseMessage += `   - Labor: ${formatCurrency(record['353'])}\n`;
                      if (record['354']) responseMessage += `   - Contingency: ${formatCurrency(record['354'])}\n`;
                      if (record['355']) responseMessage += `   - Subcontractor: ${formatCurrency(record['355'])}\n`;
                      if (record['376']) responseMessage += `   - **Total Cost Budget: ${formatCurrency(record['376'])}**\n`;
                    }
                    
                    // Budget Revenue
                    if (record['356'] || record['357'] || record['374']) {
                      responseMessage += '   *Budget Revenue:*\n';
                      if (record['356']) responseMessage += `   - Labor Revenue: ${formatCurrency(record['356'])}\n`;
                      if (record['357']) responseMessage += `   - Material Revenue: ${formatCurrency(record['357'])}\n`;
                      if (record['374']) responseMessage += `   - **Total Revenue Budget: ${formatCurrency(record['374'])}**\n`;
                    }
                    
                    // Gross Margin Analysis
                    if (record['106'] || record['107'] || record['110'] || record['111']) {
                      responseMessage += '   *Gross Margin Analysis:*\n';
                      if (record['110']) responseMessage += `   - GM Budget ($): ${formatCurrency(record['110'])}\n`;
                      if (record['111']) responseMessage += `   - GM Actual ($): ${formatCurrency(record['111'])}\n`;
                      if (record['107']) responseMessage += `   - GM Budget (%): ${formatPercent(record['107'])}\n`;
                      if (record['109']) responseMessage += `   - GM Actual (%): ${formatPercent(record['109'])}\n`;
                      
                      // Analysis
                      if (record['110'] && record['111']) {
                        const budgetGM = record['110']?.value || record['110'];
                        const actualGM = record['111']?.value || record['111'];
                        const variance = actualGM - budgetGM;
                        if (variance < 0) {
                          responseMessage += `   ⚠️ **GM Variance: ${formatCurrency(variance)} (Under budget)**\n`;
                        } else {
                          responseMessage += `   ✅ **GM Variance: ${formatCurrency(variance)} (Over budget)**\n`;
                        }
                      }
                    }
                    
                    // Cost Commitment & Utilization
                    if (record['115'] || record['116'] || record['117']) {
                      responseMessage += '   *Cost Commitments:*\n';
                      if (record['115']) responseMessage += `   - Committed Cost (Actual): ${formatCurrency(record['115'])}\n`;
                      if (record['116']) responseMessage += `   - Committed Cost (Projected): ${formatCurrency(record['116'])}\n`;
                      if (record['117']) {
                        const utilization = record['117']?.value || record['117'];
                        responseMessage += `   - Cost Utilized: ${formatPercent(utilization)}\n`;
                        if (utilization > 0.9) {
                          responseMessage += `   ⚠️ **Warning: ${(utilization * 100).toFixed(1)}% of budget utilized**\n`;
                        }
                      }
                    }
                    
                    // Invoicing Status
                    if (record['156'] || record['157'] || record['158'] || record['159']) {
                      responseMessage += '   *Invoicing Status:*\n';
                      if (record['156']) responseMessage += `   - Total Submitted: ${formatCurrency(record['156'])}\n`;
                      if (record['157']) responseMessage += `   - Total Pending: ${formatCurrency(record['157'])}\n`;
                      if (record['158']) responseMessage += `   - Total Invoice Count: ${record['158']?.value || record['158']}\n`;
                      if (record['159']) {
                        const projectedBilling = record['159']?.value || record['159'];
                        responseMessage += `   - Projected Billing: ${formatCurrency(projectedBilling)}\n`;
                        // Note negative progress
                        if (projectedBilling < 0) {
                          responseMessage += `   🚨 **Alert: Negative projected billing indicates serious issue**\n`;
                        }
                      }
                    }
                    
                    // Overall Analysis
                    responseMessage += '\n   **📊 Project Analysis:**\n';
                    
                    // Check for budget overrun
                    const budgetCost = record['376']?.value || record['376'];
                    const budgetRev = record['374']?.value || record['374'];
                    if (budgetCost && budgetRev) {
                      const margin = budgetRev - budgetCost;
                      const marginPercent = (margin / budgetRev) * 100;
                      if (margin > 0) {
                        responseMessage += `   ✅ Projected Profit: ${formatCurrency(margin)} (${marginPercent.toFixed(1)}% margin)\n`;
                      } else {
                        responseMessage += `   🚨 Projected Loss: ${formatCurrency(Math.abs(margin))} (${Math.abs(marginPercent).toFixed(1)}% loss)\n`;
                      }
                    }
                    
                    // Note any data anomalies
                    const costUtilized = record['117']?.value || record['117'];
                    if (costUtilized && costUtilized < 0) {
                      responseMessage += `   ⚠️ Data Issue: Negative cost utilization (${(costUtilized * 100).toFixed(2)}%) needs investigation\n`;
                    }
                  }
                  
                  responseMessage += '\n';
                });
              } else {
                // Generic table display
                responseMessage = `Found ${records.length} record${records.length > 1 ? 's' : ''}:\n\n`;
                records.slice(0, 10).forEach((record: any, index: number) => {
                  responseMessage += `${index + 1}. `;
                  // Try to find a name or title field
                  const displayName = record.name || record.title || record.label || `Record ${record.id || index + 1}`;
                  responseMessage += `**${displayName}**\n`;
                  
                  // Show first few fields
                  Object.entries(record).slice(0, 4).forEach(([key, value]) => {
                    if (key !== 'id' && key !== 'name' && key !== 'title' && key !== 'label') {
                      responseMessage += `   ${key}: ${value}\n`;
                    }
                  });
                  responseMessage += '\n';
                });
              }
              
              if (records.length > 10) {
                responseMessage += `... and ${records.length - 10} more records`;
              }
            } else {
              responseMessage = 'No records found matching your query.';
            }
          } else {
            // Generic result display with better formatting
            responseMessage = `Operation completed successfully.\n\n`;
            if (typeof toolResult === 'object' && toolResult !== null) {
              // Check for content array (MCP response format)
              if (toolResult.content && Array.isArray(toolResult.content)) {
                const content = toolResult.content[0];
                if (content?.type === 'text') {
                  try {
                    const parsed = JSON.parse(content.text);
                    if (parsed.fields && Array.isArray(parsed.fields)) {
                      // This is a fields response
                      responseMessage = `The table has ${parsed.fields.length} fields:\n\n`;
                      parsed.fields.slice(0, 15).forEach((field: any, index: number) => {
                        responseMessage += `${index + 1}. **${field.label || field.name}** (${field.fieldType || field.field_type || field.type})`;
                        if (field.required) responseMessage += ' - Required';
                        responseMessage += '\n';
                      });
                      if (parsed.fields.length > 15) {
                        responseMessage += `\n... and ${parsed.fields.length - 15} more fields`;
                      }
                    } else {
                      // Generic parsed display
                      responseMessage += JSON.stringify(parsed, null, 2);
                    }
                  } catch {
                    responseMessage = content.text || 'Operation completed';
                  }
                }
              } else if (toolResult.fields && Array.isArray(toolResult.fields)) {
                // Direct fields array
                responseMessage = `The table has ${toolResult.fields.length} fields:\n\n`;
                toolResult.fields.slice(0, 15).forEach((field: any, index: number) => {
                  responseMessage += `${index + 1}. **${field.label || field.name}** (${field.field_type || field.type})`;
                  if (field.required) responseMessage += ' - Required';
                  responseMessage += '\n';
                });
                if (toolResult.fields.length > 15) {
                  responseMessage += `\n... and ${toolResult.fields.length - 15} more fields`;
                }
              } else {
                // Fallback for other structures
                Object.entries(toolResult).slice(0, 5).forEach(([key, value]) => {
                  responseMessage += `- ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`;
                });
              }
            }
          }
          
          addMessage('assistant', responseMessage, toolResult);
        } catch (error) {
          addMessage('assistant', `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (aiResult && aiResult.action === 'response' && aiResult.message) {
        // Claude is providing a summary or response
        addMessage('assistant', aiResult.message);
      } else if (aiResult && aiResult.action === 'summary' && aiResult.message) {
        // Claude is providing a comprehensive summary of the data
        addMessage('assistant', aiResult.message, aiResult.data);
      } else {
        // Unexpected response format - log it and show error
        console.error('Unexpected AI response format:', aiResult);
        addMessage('assistant', 'I understood your request but had trouble processing it. Let me try again. Can you rephrase your question?');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      // Check if the error is because we're showing the raw JSON
      // This happens when the AI response doesn't match our expected format
      addMessage('assistant', 'I had trouble processing that request. Let me try a different approach. Try asking me to "list tables" or "test connection".');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userInput = input;
    setInput('');
    addMessage('user', userInput);
    setIsProcessing(true);

    await processWithAI(userInput);
    setIsProcessing(false);
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="border-b p-3 sm:p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h2 className="font-semibold text-sm sm:text-base">QuickBase AI Assistant</h2>
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Powered by Claude 3.5 Sonnet</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2 sm:p-4 pb-24 sm:pb-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {message.role === 'user' ? <User className="h-3 w-3 sm:h-4 sm:w-4" /> : <Bot className="h-3 w-3 sm:h-4 sm:w-4" />}
              </div>

              <div className="flex flex-col gap-2 max-w-[95%] sm:max-w-[85%] lg:max-w-[80%]">
                <Card className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
                }`}>
                  {message.role === 'assistant' && shouldBeCollapsible(message.content) ? (
                    <div>
                      <Markdown 
                        content={
                          expandedMessages.has(message.id) 
                            ? message.content 
                            : getMessagePreview(message.content)
                        } 
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMessageExpansion(message.id)}
                        className="mt-2 p-1 h-auto text-xs"
                      >
                        {expandedMessages.has(message.id) ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show more
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Markdown content={message.content} />
                  )}
                </Card>
                
                {message.data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View raw data
                    </summary>
                    <Card className="p-2 mt-1">
                      <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </Card>
                  </details>
                )}
                
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {typeof window !== 'undefined' ? message.timestamp.toLocaleTimeString() : ''}
                </span>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Claude is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-2 sm:p-4 border-t fixed sm:relative bottom-0 left-0 right-0 bg-card z-10 sm:z-auto">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me anything..."
            disabled={isProcessing}
            className="h-11 sm:h-10 text-base sm:text-sm"
          />
          <Button onClick={handleSend} disabled={isProcessing || !input.trim()} className="h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0">
            {isProcessing ? <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" /> : <Send className="h-5 w-5 sm:h-4 sm:w-4" />}
          </Button>
        </div>

        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('What tables do I have?')}
            disabled={isProcessing}
            className="h-9 text-xs sm:text-sm"
          >
            What tables?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Test my QuickBase connection')}
            disabled={isProcessing}
            className="h-9 text-xs sm:text-sm"
          >
            Test connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Show me recent records')}
            disabled={isProcessing}
            className="h-9 text-xs sm:text-sm hidden sm:inline-flex"
          >
            Show records
          </Button>
        </div>
      </div>
    </Card>
  );
}