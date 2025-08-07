/**
 * Case Number Detection Test Suite
 * Tests the enhanced content detection engine for case number recognition
 */

import { contentDetectionEngine } from '@/services/contentDetectionEngine';

interface CaseNumberTestResult {
  testInput: string;
  expectedType: string;
  actualType: string;
  expectedCaseNumbers: string[];
  actualCaseNumbers: string[];
  passed: boolean;
  confidence: number;
}

export class CaseNumberDetectionTestSuite {
  private testCases = [
    {
      input: '05908032',
      expectedType: 'case_number',
      expectedCaseNumbers: ['05908032'],
      description: 'Pure 8-digit case number'
    },
    {
      input: 'Case 05908032',
      expectedType: 'case_number',
      expectedCaseNumbers: ['05908032'],
      description: 'Case with case prefix'
    },
    {
      input: 'case #05908032',
      expectedType: 'case_number',
      expectedCaseNumbers: ['05908032'],
      description: 'Case with case # prefix'
    },
    {
      input: '#05908032',
      expectedType: 'case_number',
      expectedCaseNumbers: ['05908032'],
      description: 'Case with # prefix only'
    },
    {
      input: 'ticket 05908032',
      expectedType: 'case_number',
      expectedCaseNumbers: ['05908032'],
      description: 'Case with ticket prefix'
    },
    {
      input: 'Please check case 05908032 for similar issues',
      expectedType: 'mixed_content',
      expectedCaseNumbers: ['05908032'],
      description: 'Case number in longer text (mixed content)'
    },
    {
      input: 'Similar to cases 05908032 and 05908033',
      expectedType: 'mixed_content',
      expectedCaseNumbers: ['05908032', '05908033'],
      description: 'Multiple case numbers in text'
    },
    {
      input: '12345678',
      expectedType: 'case_number',
      expectedCaseNumbers: ['12345678'],
      description: 'Different 8-digit case number'
    },
    {
      input: '1234567',
      expectedType: 'plain_text',
      expectedCaseNumbers: [],
      description: '7-digit number (should not match)'
    },
    {
      input: '123456789',
      expectedType: 'plain_text',
      expectedCaseNumbers: [],
      description: '9-digit number (should not match)'
    },
    {
      input: 'abc05908032def',
      expectedType: 'plain_text',
      expectedCaseNumbers: [],
      description: '8-digit embedded in text (should not match without boundaries)'
    }
  ];

  /**
   * Run all case number detection tests
   */
  async runAllTests(): Promise<CaseNumberTestResult[]> {
    console.log('🔢 Running Case Number Detection Test Suite...\n');
    
    const results: CaseNumberTestResult[] = [];
    
    for (const testCase of this.testCases) {
      console.log(`Testing: "${testCase.input}" - ${testCase.description}`);
      
      const result = await contentDetectionEngine.analyzeContent(testCase.input);
      
      if (result.success) {
        const analysis = result.data;
        const actualCaseNumbers = analysis.extractedData.caseNumbers || [];
        
        const testResult: CaseNumberTestResult = {
          testInput: testCase.input,
          expectedType: testCase.expectedType,
          actualType: analysis.contentType,
          expectedCaseNumbers: testCase.expectedCaseNumbers,
          actualCaseNumbers,
          passed: this.evaluateResult(testCase, analysis.contentType, actualCaseNumbers),
          confidence: analysis.confidence
        };
        
        results.push(testResult);
        
        const status = testResult.passed ? '✅' : '❌';
        console.log(`  ${status} Type: ${analysis.contentType} (expected: ${testCase.expectedType})`);
        console.log(`  ${status} Case Numbers: [${actualCaseNumbers.join(', ')}] (expected: [${testCase.expectedCaseNumbers.join(', ')}])`);
        console.log(`     Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      } else {
        console.log(`❌ Analysis failed: ${result.error.message}`);
        results.push({
          testInput: testCase.input,
          expectedType: testCase.expectedType,
          actualType: 'ERROR',
          expectedCaseNumbers: testCase.expectedCaseNumbers,
          actualCaseNumbers: [],
          passed: false,
          confidence: 0
        });
      }
      console.log('');
    }
    
    this.printSummary(results);
    return results;
  }

  /**
   * Evaluate if the test result matches expectations
   */
  private evaluateResult(testCase: any, actualType: string, actualCaseNumbers: string[]): boolean {
    const typeMatch = actualType === testCase.expectedType;
    const caseNumbersMatch = this.arrayEquals(
      actualCaseNumbers.sort(), 
      testCase.expectedCaseNumbers.sort()
    );
    
    return typeMatch && caseNumbersMatch;
  }

  /**
   * Check if two arrays are equal
   */
  private arrayEquals(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  /**
   * Print test results summary
   */
  private printSummary(results: CaseNumberTestResult[]): void {
    console.log('📊 Case Number Detection Test Results Summary\n');
    console.log('=' .repeat(70));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const passRate = (passed / total) * 100;
    
    console.log(`Overall Results: ${passed}/${total} tests passed (${passRate.toFixed(1)}%)\n`);
    
    // Show failed tests
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('❌ Failed Tests:');
      failed.forEach(result => {
        console.log(`  "${result.testInput}"`);
        console.log(`    Expected: ${result.expectedType} with [${result.expectedCaseNumbers.join(', ')}]`);
        console.log(`    Actual: ${result.actualType} with [${result.actualCaseNumbers.join(', ')}]`);
      });
      console.log('');
    }
    
    // Show confidence distribution
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    if (passRate >= 90) {
      console.log('🎉 Excellent case number detection performance!');
    } else if (passRate >= 75) {
      console.log('👍 Good case number detection performance');
    } else {
      console.log('⚠️ Case number detection needs improvement');
    }
  }

  /**
   * Test suggested actions for case numbers
   */
  async testCaseNumberActions(): Promise<void> {
    console.log('\n🎯 Testing Case Number Actions...\n');
    
    const testCases = ['05908032', 'Case #12345678', 'ticket 99999999'];
    
    for (const testInput of testCases) {
      console.log(`Testing actions for: "${testInput}"`);
      
      const pasteResult = await contentDetectionEngine.createPasteEvent(testInput);
      
      if (pasteResult.success) {
        const pasteEvent = pasteResult.data;
        console.log(`  Content Type: ${pasteEvent.contentType}`);
        console.log(`  Suggested Actions:`);
        
        pasteEvent.suggestedActions.forEach(action => {
          console.log(`    - ${action.label}: ${action.description} (${(action.confidence * 100).toFixed(0)}%)`);
        });
        
        const lookupAction = pasteEvent.suggestedActions.find(a => a.type === 'lookup_case');
        if (lookupAction) {
          console.log(`  ✅ Lookup action found with case number: ${lookupAction.data?.caseNumber}`);
        } else {
          console.log(`  ❌ No lookup action found`);
        }
      } else {
        console.log(`  ❌ Failed to create paste event: ${pasteResult.error.message}`);
      }
      console.log('');
    }
  }
}

// Export test runner function
export async function runCaseNumberDetectionTests(): Promise<void> {
  const testSuite = new CaseNumberDetectionTestSuite();
  
  await testSuite.runAllTests();
  await testSuite.testCaseNumberActions();
}

// Browser console runner
(window as any).runCaseNumberDetectionTests = runCaseNumberDetectionTests;