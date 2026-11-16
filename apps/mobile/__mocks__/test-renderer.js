/**
 * Shim: maps the new `test-renderer` API (React 19 style expected by
 * @testing-library/react-native v14) onto `react-test-renderer` (React 19)
 * which only exports `create`, not `createRoot`.
 */
'use strict';

const ReactTestRenderer = require('react-test-renderer');

function attachHelpers(instance, root) {
  if (!root) return root;

  root.toJSON = () => instance.toJSON();

  root.queryAll = (predicate, opts = {}) => {
    try {
      const all = root.findAll(predicate, { deep: true });
      if (opts.matchDeepestOnly) {
        return all.filter(node => !all.some(other => other !== node && node.findAll(() => true).includes(other)));
      }
      const hosts = all.filter(node => typeof node.type === 'string');
      if (hosts.length > 0 && hosts.length < all.length) {
        return hosts;
      }
      return all;
    } catch {
      return [];
    }
  };

  return root;
}

function createRoot(options) {
  let instance = null;

  return {
    render(element) {
      if (instance) {
        instance.update(element);
      } else {
        instance = ReactTestRenderer.create(element, options);
      }
    },
    get container() {
      if (!instance) return null;
      try {
        return attachHelpers(instance, instance.root);
      } catch {
        return null;
      }
    },
    unmount() {
      if (instance) {
        try {
          instance.unmount();
        } catch {}
        instance = null;
      }
    },
  };
}

module.exports = {
  ...ReactTestRenderer,
  createRoot,
};
