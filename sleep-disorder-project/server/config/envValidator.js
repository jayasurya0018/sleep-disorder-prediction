/**
 * Environment Validator
 * Validates all required environment variables at startup
 */

const validateEnvironment = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT',
    'CLIENT_URL'
  ];

  const optional = [
    'NODE_ENV',
    'FITBIT_CLIENT_ID',
    'FITBIT_CLIENT_SECRET',
    'OURA_CLIENT_ID',
    'OURA_CLIENT_SECRET',
    'GARMIN_CLIENT_ID',
    'GARMIN_CLIENT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];

  const missing = [];
  const warnings = [];

  // Check required vars
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Check optional vars in production
  if (process.env.NODE_ENV === 'production') {
    optional.forEach(key => {
      if (!process.env[key] && key.includes('CLIENT')) {
        warnings.push(`${key} not set - OAuth will be unavailable`);
      }
      if (!process.env[key] && key.includes('EMAIL')) {
        warnings.push(`${key} not set - Email alerts will be disabled`);
      }
    });
  }

  // Fail if required vars missing
  if (missing.length > 0) {
    console.error('❌ FATAL: Missing required environment variables:');
    missing.forEach(k => console.error(`   - ${k}`));
    console.error('\nPlease set these env vars before running the app.');
    process.exit(1);
  }

  // Warn about optional vars
  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  console.log('✅ Environment validation passed');
};

module.exports = validateEnvironment;
