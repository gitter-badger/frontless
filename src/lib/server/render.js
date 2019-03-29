import riot from '../riot';

riot.settings.asyncRenderTimeout = 20000;
const PAGE_SUFFIX = '-front-less-page';

/**
 * @alias riot.renderAsync
 * @param {string} tag - name of the riot tag
 * @param {Object|undefined} opts - riot compiler options
 * @async
 */
export async function render(tag, opts={}) {
  return await riot.renderAsync(tag, opts);
}
/**
 * Render a page async using Riot Template
 * @param {string} tag - riot tag name
 * @param {Object} opts - riot tag options
 * @async
 */
export async function renderPage(tag, opts={}) {
  const data = await riot.renderAsync(tag, opts);
  const unwrap = new RegExp('\<(\/?)' +tag+ '\>', 'gi');
  return Promise.resolve(data.replace(unwrap, ''));
}

/**
 * Resolve tag name
 * @param {string} path - requested route
 * @return {string} - tag name
 * */
export function resolvePageName(path) {
  const parts = path.split('/').filter((e) => !!e);
  const name = (parts.length ? parts.join('-') : 'index') + PAGE_SUFFIX;
  return name;
};
