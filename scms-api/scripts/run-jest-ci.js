const { runCLI } = require('jest');
const path = require('path');

(async () => {
  try {
    // Ensure CI mode
    process.env.CI = 'true';

    const root = path.resolve(__dirname, '..');
    const config = {
      runInBand: true,
      coverage: true,
      silent: false,
      forceExit: true,
    };

    const { results } = await runCLI(config, [root]);

    if (!results || results.success === false) {
      console.error('Jest reported failures');
      process.exit(results.numFailedTests || 1);
    }

    console.log('Jest finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error running jest via runCLI:', err);
    process.exit(2);
  }
})();
