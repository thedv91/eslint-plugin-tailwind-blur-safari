const { RuleTester } = require('eslint');
const rule = require('./blur');

const parserOptions = {
  ecmaVersion: 2019,
  sourceType: 'module',
  ecmaFeatures: {
    jsx: true,
  },
};

const config = [
  {
    config: {
      darkMode: 'class',
    },
  },
];

const ruleTester = new RuleTester({
  // Must use at least ecmaVersion 2015 because
  // that's when `const` variables were introduced.
  parserOptions,
});

// Throws error if the tests in ruleTester.run() do not pass
ruleTester.run(
  'tailwind-gpu-transform-blur', // rule name
  rule, // rule code
  {
    // checks
    // 'valid' checks cases that should pass
    valid: [
      {
        code: `
        <div className="demo blur-50 transform-gpu">Hello</div>
        `,
        options: config,
      },
      {
        code: `
        <div className="demo blur-[50px] transform-gpu">Hello</div>
        `,
        options: config,
      },
      {
        code: `
        <div className="demo backdrop-blur-0 transform-gpu">Hello</div>
        `,
        options: config,
      },
    ],
    // 'invalid' checks cases that should not pass
    invalid: [
      {
        code: `
        <div className="demo blur-50">Hello</div>
        `,
        options: config,
        errors: 1,
      },
      {
        code: `
        <div className="demo blur-50 backdrop-blur-10">Hello</div>
        `,
        options: config,
        errors: 1,
      },
    ],
  },
);

console.log('All tests passed!');
