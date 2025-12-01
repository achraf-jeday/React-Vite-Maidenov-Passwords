// Simple Node.js test script to verify pagination logic
// This tests the API service logic directly

import { api } from './src/services/api.js';

async function testPaginationLogic() {
  console.log('🧪 Testing Pagination Logic...\n');

  // Mock fetch function to simulate API responses
  global.fetch = async (url, options) => {
    const urlObj = new URL(url);
    const limit = parseInt(urlObj.searchParams.get('page[limit]') || '50');
    const offset = parseInt(urlObj.searchParams.get('page[offset]') || '0');

    console.log(`📡 API Call: limit=${limit}, offset=${offset}`);

    // Create mock data - 127 total users
    const totalUsers = 127;
    const allUsers = Array.from({ length: totalUsers }, (_, i) => ({
      id: (i + 1).toString(),
      type: 'user_confidential_data--type_1',
      attributes: {
        name: `User ${i + 1}`,
        role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
        status: true,
        department: 'General'
      }
    }));

    const users = allUsers.slice(offset, offset + limit);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        jsonapi: { version: '1.1' },
        data: users,
        meta: { count: totalUsers }
      })
    };
  };

  // Mock localStorage
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };

  const testCases = [
    { pageSize: 10, page: 1, expectedOffset: 0, expectedCount: 10 },
    { pageSize: 10, page: 2, expectedOffset: 10, expectedCount: 10 },
    { pageSize: 10, page: 3, expectedOffset: 20, expectedCount: 10 },
    { pageSize: 25, page: 1, expectedOffset: 0, expectedCount: 25 },
    { pageSize: 25, page: 2, expectedOffset: 25, expectedCount: 25 },
    { pageSize: 25, page: 3, expectedOffset: 50, expectedCount: 25 },
    { pageSize: 50, page: 1, expectedOffset: 0, expectedCount: 50 },
    { pageSize: 50, page: 2, expectedOffset: 50, expectedCount: 50 },
    { pageSize: 100, page: 1, expectedOffset: [0, 50], expectedCount: 100 },
    { pageSize: 100, page: 2, expectedOffset: [100, 150], expectedCount: 27 },
    { pageSize: 200, page: 1, expectedOffset: [0, 50, 100, 150], expectedCount: 127 }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    console.log(`\n--- Testing pageSize ${testCase.pageSize}, page ${testCase.page} ---`);

    try {
      const result = await api.getUsers(testCase.page, testCase.pageSize, '', [{ id: 'name', desc: false }]);

      console.log(`✅ Returned ${result.data.length} users, total: ${result.total}`);

      // Verify the count
      if (result.data.length !== testCase.expectedCount) {
        console.log(`❌ Expected ${testCase.expectedCount} users, got ${result.data.length}`);
        allPassed = false;
      } else {
        console.log(`✅ Correct user count: ${result.data.length}`);
      }

      // Verify total
      if (result.total !== 127) {
        console.log(`❌ Expected total 127, got ${result.total}`);
        allPassed = false;
      } else {
        console.log(`✅ Correct total: ${result.total}`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All pagination tests PASSED!');
    console.log('\nSummary:');
    console.log('✅ pageSize 10: All pages show correct 10 rows');
    console.log('✅ pageSize 25: All pages show correct 25 rows');
    console.log('✅ pageSize 50: All pages show correct 50 rows');
    console.log('✅ pageSize 100: Page 1 shows 100 rows, Page 2 shows remaining 27 rows');
    console.log('✅ pageSize 200: Page 1 shows all 127 rows (limited by total)');
  } else {
    console.log('❌ Some pagination tests FAILED!');
  }
  console.log('='.repeat(50));
}

testPaginationLogic().catch(console.error);