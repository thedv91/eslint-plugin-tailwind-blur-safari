'use strict';

const getOption = require('../util/settings');
const ast = require('../util/ast');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce transform GPU for blur.',
    },
    fixable: null,
    messages: {
      missingGPUTransform:
        'Missing class `transform-gpu` to fix blur on Safari.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          callees: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
          },
          ignoredKeys: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
          },
          config: {
            type: ['string', 'object'],
          },
          tags: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
          },
        },
      },
    ],
  },
  create(context) {
    const callees = getOption(context, 'callees');
    const skipClassAttribute = getOption(context, 'skipClassAttribute');
    const tags = getOption(context, 'tags');
    // const twConfig = getOption(context, 'config');
    const classRegex = getOption(context, 'classRegex');
    const classCheckBlur = ['blur', 'backdrop-blur'];

    const parseGPUTransformClassNames = (node, arg = null) => {
      let originalClassNamesValue = null;
      if (arg === null) {
        originalClassNamesValue = ast.extractValueFromNode(node);
      } else {
        switch (arg.type) {
          case 'Identifier':
            return;
          case 'TemplateLiteral':
            arg.expressions.forEach((exp) => {
              parseGPUTransformClassNames(node, exp);
            });
            arg.quasis.forEach((quasis) => {
              parseGPUTransformClassNames(node, quasis);
            });
            return;
          case 'ConditionalExpression':
            parseGPUTransformClassNames(node, arg.consequent);
            parseGPUTransformClassNames(node, arg.alternate);
            return;
          case 'LogicalExpression':
            parseGPUTransformClassNames(node, arg.right);
            return;
          case 'ArrayExpression':
            arg.elements.forEach((el) => {
              parseGPUTransformClassNames(node, el);
            });
            return;
          case 'ObjectExpression':
            const isUsedByClassNamesPlugin =
              node.callee && node.callee.name === 'classnames';
            const isVue = node.key && node.key.type === 'VDirectiveKey';
            arg.properties.forEach((prop) => {
              const propVal =
                isUsedByClassNamesPlugin || isVue ? prop.key : prop.value;
              parseGPUTransformClassNames(node, propVal);
            });
            return;
          case 'Property':
            parseGPUTransformClassNames(node, arg.key);
            return;
          case 'Literal':
            originalClassNamesValue = arg.value;
            break;
          case 'TemplateElement':
            originalClassNamesValue = arg.value.raw;
            if (originalClassNamesValue === '') {
              return;
            }
            break;
        }
      }
      const { classNames } = ast.extractClassnamesFromValue(
        originalClassNamesValue,
      );
      const hasBlur = classNames.some((attr) => {
        return classCheckBlur.some(
          (c) => attr.startsWith(`${c}-`) || c === attr,
        );
      });
      const hasTransformGPU = classNames.includes('transform-gpu');
      if (!hasBlur || hasTransformGPU) return;
      context.report({
        node,
        messageId: 'missingGPUTransform',
      });
    };

    const attributeVisitor = function (node) {
      if (!ast.isClassAttribute(node, classRegex) || skipClassAttribute) {
        return;
      }
      if (ast.isLiteralAttributeValue(node)) {
        parseGPUTransformClassNames(node);
      } else if (node.value && node.value.type === 'JSXExpressionContainer') {
        parseGPUTransformClassNames(node, node.value.expression);
      }
    };

    const callExpressionVisitor = function (node) {
      const calleeStr = ast.calleeToString(node.callee);
      if (!callees.includes(calleeStr)) {
        return;
      }

      node.arguments.forEach((arg) => {
        parseGPUTransformClassNames(node, arg);
      });
    };
    const scriptVisitor = {
      JSXAttribute: attributeVisitor,
      TextAttribute: attributeVisitor,
      CallExpression: callExpressionVisitor,
      TaggedTemplateExpression: function (node) {
        if (!tags.includes(ast.calleeToString(node.tag))) {
          return;
        }
        parseGPUTransformClassNames(node, node.quasi);
      },
    };
    // const templateVisitor = {
    //   CallExpression: callExpressionVisitor,
    //   VAttribute: function (node) {
    //     switch (true) {
    //       case !ast.isValidVueAttribute(node, classRegex):
    //         return;
    //       case ast.isVLiteralValue(node):
    //         parseGPUTransformClassNames(node);
    //         break;
    //       case ast.isArrayExpression(node):
    //         node.value.expression.elements.forEach((arg) => {
    //           parseGPUTransformClassNames(node, arg);
    //         });
    //         break;
    //       case ast.isObjectExpression(node):
    //         node.value.expression.properties.forEach((prop) => {
    //           parseGPUTransformClassNames(node, prop);
    //         });
    //         break;
    //     }
    //   },
    // };
    return scriptVisitor;
  },
};
