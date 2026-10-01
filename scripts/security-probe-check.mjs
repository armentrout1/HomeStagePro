#!/usr/bin/env node

const BASE_URL = process.argv[2] || 'http://localhost:5000';

const probePaths = [
  // Sensitive probe paths (should return 404)
  { path: '/.git/config', expected: 404, type: 'SECURITY' },
  { path: '/.env', expected: 404, type: 'SECURITY' },
  { path: '/.aws/credentials', expected: 404, type: 'SECURITY' },
  { path: '/secrets/stripe.json', expected: 404, type: 'SECURITY' },
  { path: '/config/parameters.yml', expected: 404, type: 'SECURITY' },
  { path: '/backend/config/settings.yml', expected: 404, type: 'SECURITY' },
  { path: '/storage/app/keys/stripe.key', expected: 404, type: 'SECURITY' },
  { path: '/admin/config', expected: 404, type: 'SECURITY' },
  { path: '/credentials.txt', expected: 404, type: 'SECURITY' },
  { path: '/config.php', expected: 404, type: 'SECURITY' },
  { path: '/database.sql', expected: 404, type: 'SECURITY' },
  { path: '/backup.zip', expected: 404, type: 'SECURITY' },
  
  // Legitimate SPA routes (should return 200)
  { path: '/gallery', expected: 200, type: 'SPA' },
  { path: '/sales', expected: 200, type: 'SPA' },
  { path: '/upgrade', expected: 200, type: 'SPA' },
  { path: '/about', expected: 200, type: 'SPA' },
  { path: '/contact', expected: 200, type: 'SPA' },
  { path: '/', expected: 200, type: 'SPA' },
  
  // API routes (should return their expected status codes)
  { path: '/api/usage-status', expected: 200, type: 'API', anonymousUsage: true },
  { path: '/api/health', expected: 200, type: 'API' },
  
  // Static assets (should return 200)
  { path: '/robots.txt', expected: 200, type: 'ASSET' },
  { path: '/favicon.ico', expected: 200, type: 'ASSET' },
];

async function checkPath(pathInfo) {
  const url = `${BASE_URL}${pathInfo.path}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Security-Probe-Check/1.0'
      }
    });
    
    const status = response.status;
    let passed = status === pathInfo.expected;
    if (pathInfo.anonymousUsage && passed) {
      const body = await response.json();
      passed = body.status === 'payment_required' && body.totalRemaining === 0 && body.remaining === 0 && body.paidGranted === undefined && body.planId === undefined;
    }
    
    return {
      ...pathInfo,
      url,
      actual: status,
      passed,
      statusText: passed ? '✅ PASS' : '❌ FAIL'
    };
  } catch (error) {
    return {
      ...pathInfo,
      url,
      actual: 'ERROR',
      passed: false,
      statusText: `❌ ERROR - ${error.message}`
    };
  }
}

async function runSecurityProbeCheck() {
  console.log(`🔍 Security Probe Check for ${BASE_URL}`);
  console.log('='.repeat(60));
  
  const results = await Promise.all(probePaths.map(checkPath));
  
  // Group results by type
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {});
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Print results by type
  for (const [type, typeResults] of Object.entries(grouped)) {
    console.log(`\n📂 ${type} Paths:`);
    console.log('-'.repeat(40));
    
    for (const result of typeResults) {
      console.log(`${result.statusText.padEnd(8)} | ${result.actual.toString().padEnd(4)} | ${result.path}`);
      if (result.passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All security probes are properly configured!');
  } else {
    console.log('\n⚠️  Some security probes are not behaving as expected.');
    console.log('   Check the FAIL results above for details.');
  }
  
  // Exit with appropriate code
  process.exit(totalFailed === 0 ? 0 : 1);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Security probe check interrupted');
  process.exit(1);
});

runSecurityProbeCheck().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
