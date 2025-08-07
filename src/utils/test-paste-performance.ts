/**
 * Performance testing suite for sophisticated paste tool
 * Tests content analysis speed and batch processing capabilities
 */

import { contentDetectionEngine } from '@/services/contentDetectionEngine';
import { clipboardService } from '@/services/clipboardService';
import { usePasteStore } from '@/stores/pasteStore';

interface PerformanceTestResult {
  testName: string;
  iterations: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  passedRequirement: boolean;
  requirement: number;
}

export class PastePerformanceTestSuite {
  private testContents = {
    supportRequest: `
      Hi team, I'm having issues with my dashboard. The charts aren't loading properly and I'm getting 
      error messages. This is urgent as it's affecting our production environment. Can you help?
      Browser: Chrome 120.0.6099.109
      OS: Windows 11
      Error: TypeError: Cannot read properties of undefined (reading 'data')
    `,
    
    consoleLog: `
      Uncaught TypeError: Cannot read properties of undefined (reading 'data')
          at ChartComponent.render (dashboard.js:145:23)
          at Object.execute (runtime.js:2341:12)
          at doWork (scheduler.js:253:10)
          at performWorkUntilDeadline (scheduler.js:125:5)
      console.error: Failed to load data source
      GET https://api.example.com/data 404 (Not Found)
    `,
    
    urlContent: `
      Check out this link: https://example.com/dashboard/reports
      Also see: https://docs.example.com/troubleshooting
      Related issue: https://github.com/company/project/issues/123
    `,
    
    mixedContent: `
      Hi, I found this error in the console:
      
      Uncaught ReferenceError: analytics is not defined at dashboard.js:67
      
      Here are the relevant links:
      https://example.com/dashboard
      https://analytics.example.com/reports
      
      My email is john.doe@company.com if you need more details.
      This is happening in Chrome on Windows 10.
    `,
    
    longContent: `
      This is a very long support request that contains multiple paragraphs and extensive details
      about the issue. ${' Extended content text.'.repeat(100)}
      Error details: Multiple errors occurred during processing.
      URL references: https://example.com/long-url-with-many-parameters?param1=value1&param2=value2
      Contact: support-user@company.com
    `
  };

  /**
   * Run all performance tests
   */
  async runAllTests(): Promise<PerformanceTestResult[]> {
    console.log('🚀 Running Paste Performance Test Suite...\n');
    
    const results: PerformanceTestResult[] = [];
    
    // Test content analysis performance
    results.push(await this.testContentAnalysisSpeed());
    results.push(await this.testBatchProcessing());
    results.push(await this.testComplexContentAnalysis());
    results.push(await this.testCaseCreationSpeed());
    
    // Print results summary
    this.printResultsSummary(results);
    
    return results;
  }

  /**
   * Test basic content analysis speed
   */
  private async testContentAnalysisSpeed(): Promise<PerformanceTestResult> {
    console.log('Testing content analysis speed...');
    
    const iterations = 10;
    const times: number[] = [];
    const requirement = 500; // 500ms max requirement
    
    for (let i = 0; i < iterations; i++) {
      const content = this.testContents.supportRequest;
      const startTime = performance.now();
      
      const result = await contentDetectionEngine.analyzeContent(content);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      if (!result.success) {
        console.warn(`Analysis failed on iteration ${i + 1}:`, result.error);
      }
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    return {
      testName: 'Content Analysis Speed',
      iterations,
      averageTime,
      maxTime,
      minTime,
      passedRequirement: averageTime < requirement,
      requirement
    };
  }

  /**
   * Test batch processing multiple paste events
   */
  private async testBatchProcessing(): Promise<PerformanceTestResult> {
    console.log('Testing batch processing...');
    
    const batchSize = 5;
    const iterations = 3;
    const times: number[] = [];
    const requirement = 1000; // 1000ms for batch of 5
    
    for (let i = 0; i < iterations; i++) {
      const contents = Object.values(this.testContents);
      const startTime = performance.now();
      
      const promises = contents.slice(0, batchSize).map(content => 
        contentDetectionEngine.analyzeContent(content)
      );
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      const successCount = results.filter(r => r.success).length;
      console.log(`Batch ${i + 1}: ${successCount}/${batchSize} successful, ${duration.toFixed(2)}ms`);
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    return {
      testName: 'Batch Processing',
      iterations,
      averageTime,
      maxTime,
      minTime,
      passedRequirement: averageTime < requirement,
      requirement
    };
  }

  /**
   * Test complex content with mixed types
   */
  private async testComplexContentAnalysis(): Promise<PerformanceTestResult> {
    console.log('Testing complex content analysis...');
    
    const iterations = 5;
    const times: number[] = [];
    const requirement = 750; // 750ms for complex content
    
    for (let i = 0; i < iterations; i++) {
      const content = this.testContents.mixedContent + this.testContents.longContent;
      const startTime = performance.now();
      
      const result = await contentDetectionEngine.analyzeContent(content);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      if (result.success) {
        const analysis = result.data;
        console.log(`Iteration ${i + 1}: ${analysis.contentType}, confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      }
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    return {
      testName: 'Complex Content Analysis',
      iterations,
      averageTime,
      maxTime,
      minTime,
      passedRequirement: averageTime < requirement,
      requirement
    };
  }

  /**
   * Test end-to-end case creation speed
   */
  private async testCaseCreationSpeed(): Promise<PerformanceTestResult> {
    console.log('Testing case creation speed...');
    
    const iterations = 3;
    const times: number[] = [];
    const requirement = 1000; // 1000ms for full case creation
    
    const pasteStore = usePasteStore.getState();
    
    for (let i = 0; i < iterations; i++) {
      const content = this.testContents.supportRequest;
      const startTime = performance.now();
      
      try {
        // Create paste event
        const pasteResult = await contentDetectionEngine.createPasteEvent(content);
        
        if (pasteResult.success) {
          const pasteEvent = pasteResult.data;
          const createCaseAction = pasteEvent.suggestedActions.find(a => a.type === 'create_case');
          
          if (createCaseAction) {
            // Execute case creation
            await pasteStore.executeAction(createCaseAction, pasteEvent);
          }
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        console.log(`Case creation ${i + 1}: ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.warn(`Case creation failed on iteration ${i + 1}:`, error);
        times.push(requirement); // Mark as failed by using max time
      }
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    return {
      testName: 'End-to-End Case Creation',
      iterations,
      averageTime,
      maxTime,
      minTime,
      passedRequirement: averageTime < requirement,
      requirement
    };
  }

  /**
   * Test clipboard service performance
   */
  async testClipboardService(): Promise<void> {
    console.log('Testing clipboard service...');
    
    // Test clipboard availability check
    const startTime = performance.now();
    const availability = await clipboardService.checkAvailability();
    const duration = performance.now() - startTime;
    
    console.log(`Clipboard availability check: ${duration.toFixed(2)}ms`);
    console.log('Clipboard status:', availability);
    console.log('Service status:', clipboardService.getStatus());
  }

  /**
   * Print results summary
   */
  private printResultsSummary(results: PerformanceTestResult[]): void {
    console.log('\n📊 Performance Test Results Summary\n');
    console.log('=' .repeat(80));
    
    results.forEach(result => {
      const status = result.passedRequirement ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${result.testName}`);
      console.log(`  Average: ${result.averageTime.toFixed(2)}ms (requirement: <${result.requirement}ms)`);
      console.log(`  Range: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms`);
      console.log(`  Iterations: ${result.iterations}`);
      console.log('');
    });
    
    const passedCount = results.filter(r => r.passedRequirement).length;
    const totalCount = results.length;
    
    console.log(`Overall: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All performance requirements met!');
    } else {
      console.log('⚠️ Some performance requirements not met. Consider optimization.');
    }
  }

  /**
   * Run accuracy test for content detection
   */
  async testContentDetectionAccuracy(): Promise<void> {
    console.log('\n🎯 Testing Content Detection Accuracy...\n');
    
    const testCases = [
      { content: this.testContents.supportRequest, expectedType: 'support_request' },
      { content: this.testContents.consoleLog, expectedType: 'console_log' },
      { content: this.testContents.urlContent, expectedType: 'url_link' },
      { content: this.testContents.mixedContent, expectedType: 'mixed_content' }
    ];
    
    let correctPredictions = 0;
    
    for (const testCase of testCases) {
      const result = await contentDetectionEngine.analyzeContent(testCase.content);
      
      if (result.success) {
        const isCorrect = result.data.contentType === testCase.expectedType;
        correctPredictions += isCorrect ? 1 : 0;
        
        const status = isCorrect ? '✅' : '❌';
        console.log(`${status} Expected: ${testCase.expectedType}, Got: ${result.data.contentType} (${(result.data.confidence * 100).toFixed(1)}%)`);
      } else {
        console.log(`❌ Analysis failed for ${testCase.expectedType}`);
      }
    }
    
    const accuracy = (correctPredictions / testCases.length) * 100;
    console.log(`\nAccuracy: ${accuracy.toFixed(1)}% (${correctPredictions}/${testCases.length})`);
    
    if (accuracy >= 85) {
      console.log('🎉 Accuracy requirement met (>85%)');
    } else {
      console.log('⚠️ Accuracy requirement not met (<85%)');
    }
  }
}

// Export test runner function
export async function runPastePerformanceTests(): Promise<void> {
  const testSuite = new PastePerformanceTestSuite();
  
  await testSuite.runAllTests();
  await testSuite.testClipboardService();
  await testSuite.testContentDetectionAccuracy();
}

// Browser console runner
(window as any).runPastePerformanceTests = runPastePerformanceTests;