import { caseRepository } from '@/services/repositories/CaseRepository';
import { db } from '@/services/database';

/**
 * Test utility for repository operations
 * This file provides functions to test database functionality
 * Run in browser console: import('./utils/test-repository').then(m => m.runTests())
 */

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.open();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function testCaseNumberGeneration(): Promise<boolean> {
  try {
    const { generateCaseNumber, validateCaseNumber } = await import('@/utils/generators');
    
    const caseNumber = await generateCaseNumber();
    console.log('Generated case number:', caseNumber);
    
    if (!validateCaseNumber(caseNumber)) {
      throw new Error('Generated case number failed validation');
    }
    
    console.log('✅ Case number generation working');
    return true;
  } catch (error) {
    console.error('❌ Case number generation failed:', error);
    return false;
  }
}

export async function testCaseRepository(): Promise<boolean> {
  try {
    // Test case creation
    const testCase = {
      title: 'Test Case',
      description: 'This is a test case for repository functionality',
      status: 'pending' as const,
      priority: 'medium' as const,
      classification: 'query' as const,
      tags: ['test', 'repository'],
      artifacts: [],
      customerName: 'Test Customer'
    };

    const createResult = await caseRepository.createCase(testCase);
    if (!createResult.success) {
      throw new Error(`Case creation failed: ${createResult.error.message}`);
    }
    
    console.log('✅ Case created:', createResult.data.caseNumber);
    const createdCase = createResult.data;

    // Test find by ID
    const findResult = await caseRepository.findById(createdCase.id);
    if (!findResult.success) {
      throw new Error(`Case lookup failed: ${findResult.error.message}`);
    }
    
    console.log('✅ Case found by ID');

    // Test find by case number
    const findByCaseNumberResult = await caseRepository.findByCaseNumber(createdCase.caseNumber);
    if (!findByCaseNumberResult.success) {
      throw new Error(`Case lookup by number failed: ${findByCaseNumberResult.error.message}`);
    }
    
    console.log('✅ Case found by case number');

    // Test case update
    const updateResult = await caseRepository.updateStatus(createdCase.id, 'in_progress');
    if (!updateResult.success) {
      throw new Error(`Case update failed: ${updateResult.error.message}`);
    }
    
    console.log('✅ Case status updated');

    // Test tag operations
    const addTagsResult = await caseRepository.addTags(createdCase.id, ['database', 'indexeddb']);
    if (!addTagsResult.success) {
      throw new Error(`Add tags failed: ${addTagsResult.error.message}`);
    }
    
    console.log('✅ Tags added to case');

    // Test case assignment
    const assignResult = await caseRepository.assignCase(createdCase.id, 'test-user');
    if (!assignResult.success) {
      throw new Error(`Case assignment failed: ${assignResult.error.message}`);
    }
    
    console.log('✅ Case assigned');

    // Test statistics
    const statsResult = await caseRepository.getStatistics();
    if (!statsResult.success) {
      throw new Error(`Statistics failed: ${statsResult.error.message}`);
    }
    
    console.log('✅ Statistics retrieved:', statsResult.data);

    // Test search functionality
    const searchResult = await caseRepository.search({
      status: ['in_progress'],
      priority: ['medium']
    });
    if (!searchResult.success) {
      throw new Error(`Search failed: ${searchResult.error.message}`);
    }
    
    console.log('✅ Search functionality working, found cases:', searchResult.data.length);

    // Clean up test case
    const deleteResult = await caseRepository.delete(createdCase.id);
    if (!deleteResult.success) {
      throw new Error(`Case deletion failed: ${deleteResult.error.message}`);
    }
    
    console.log('✅ Test case cleaned up');

    return true;
  } catch (error) {
    console.error('❌ Case repository test failed:', error);
    return false;
  }
}

export async function testValidation(): Promise<boolean> {
  try {
    // Test case title validation
    const invalidCase = {
      title: '', // Invalid: empty title
      description: 'Test description',
      status: 'pending' as const,
      priority: 'medium' as const,
      classification: 'query' as const,
      tags: [],
      artifacts: []
    };

    const result = await caseRepository.createCase(invalidCase);
    if (result.success) {
      throw new Error('Validation should have failed for empty title');
    }
    
    console.log('✅ Validation correctly rejected empty title');

    // Test case number validation
    const { validateCaseNumber, validateJiraTicket } = await import('@/utils/generators');
    
    if (validateCaseNumber('12345678') !== true) {
      throw new Error('Valid case number rejected');
    }
    
    if (validateCaseNumber('1234567') !== false) {
      throw new Error('Invalid case number accepted');
    }
    
    if (validateJiraTicket('DOMO-123456') !== true) {
      throw new Error('Valid JIRA ticket rejected');
    }
    
    if (validateJiraTicket('INVALID-123') !== false) {
      throw new Error('Invalid JIRA ticket accepted');
    }
    
    console.log('✅ All validation tests passed');
    return true;
  } catch (error) {
    console.error('❌ Validation tests failed:', error);
    return false;
  }
}

export async function testDatabaseStats(): Promise<boolean> {
  try {
    const stats = await db.getStats();
    console.log('📊 Database table statistics:');
    Object.entries(stats).forEach(([tableName, count]) => {
      console.log(`  ${tableName}: ${count} records`);
    });
    
    console.log('✅ Database statistics retrieved');
    return true;
  } catch (error) {
    console.error('❌ Database statistics failed:', error);
    return false;
  }
}

export async function runAllTests(): Promise<void> {
  console.log('🧪 Starting repository tests...\n');
  
  const tests = [
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Case Number Generation', test: testCaseNumberGeneration },
    { name: 'Case Repository Operations', test: testCaseRepository },
    { name: 'Validation Logic', test: testValidation },
    { name: 'Database Statistics', test: testDatabaseStats }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n🔍 Running ${name} test...`);
    try {
      const success = await test();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${name} test threw exception:`, error);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Repository layer is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}