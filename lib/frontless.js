import evbus from './evbus';
import qs from 'qs';
import { string } from 'postcss-selector-parser';
/**
 * Provides general purpose SSR methods
 * @mixin
 */
export const RiotFrontLess = {

  /**
   * @property {string|null} - a unique tag id, the same on client and server
   * */
  _id: null,

  /**
   * @property {Riot.Observer} - an event bus
   * */
  bus: null,

  /** Initialize FrontLess mixin.
   *  @listens this#before-mount
   */
  init() {
    if (this.isServer()) {
      this.opts.req = this.parent ?
            this.parent.opts.req : (this.opts.req || {});
      this.opts.req.tags = this.opts.req.tags || [];
      this.opts.req.tags.push(this);

      this.on('before-mount', () => {
        /**
         * @event this#server
        */
        this.trigger('server');
      });

      this.on('before-ready', this.setInitialState);
    } else {
      this.opts.req = this.parent ?
              this.parent.opts.req || {} : {};
    }

    if (!this.bus) {
      this.bus = this.parent ? this.parent.bus : evbus;
    }

    this.on('mount', ()=>{
      this.setUID();
      this.initState();
    });
  },

  /** @return {boolean} */
  isServer() {
    return !process.browser;
  },

  /** @return {boolean} */
  isClient() {
    return !!process.browser;
  },

  /** Unwrap tag content */
  unwrapAsync() {
    this.on('before-ready', () => {
      this.unwrap();
    });
  },

  /** Unwrap tag content */
  unwrap() {
    if (this.root.parentNode) {
      this.root.parentNode.innerHTML = this.root.innerHTML;
    }
  },

  /**
   * Serialize a form to object
   * @param {HTMLFormElement} element - a <form> element
   * @return {object}
  */
  form(element) {
    let result = {};
    new FormData(element).forEach((value, key) => {
      result[key] = value;
    });
    return result;
  },

  /** Set a unique tag id */
  setUID() {
    if (!this._id) {
      const tagName = this.root.tagName;

      if (this.opts.req) {
        this.opts.req._counters = this.opts.req._counters || {};
      }
      const stack = this.opts.req._counters;
      stack [tagName] = stack [tagName] || 0;
      stack [tagName] ++;
      this._id = tagName + stack [tagName];
    }
    // subscribe tag on updates
    this.bus.on('update:'+this._id, (data, opts) => {
      Object.entries(data).map((entry) => {
        const [key, value] = entry;
        if (typeof this [key] !== 'function') {
          this [key] = value;
        }
      });
      this.update();
    });
  },

  /**
   * Cache a tag context into an JSON object for initialization on client.
   * Later its content gets to the `<meta name="state" />` header.
   * !! Variables and method names starting with '_' are omitted
   * */
  setInitialState() {
    if (this.isServer()) {
      this.opts.req.initialState = this.opts.req.initialState || {};
      this.opts.req.tags.map((tag) => {
        const cookedData = JSON.stringify(tag,
            (key, value) => {
              if (key.startsWith('_')) {
                return undefined;
              }
              if (typeof value === 'function') {
                return undefined;
              }
              if (key === 'bus') {
                return undefined;
              }
              if (key === 'opts') {
                const data = {...tag.opts};
                delete data ['req'];
                return data;
              }
              return value;
            });
        this.opts.req.initialState [tag._id] = JSON.parse(cookedData);
        this.update();
      });
    }
  },

  /**
   * Used only on client to inialize tags contents and
   * state from inital state sent by server.
   * Reads from the `<meta name="state" />` header.
   * @listens this#before-mount
   * */
  initState() {
    if (!this.isServer()) {
      const meta = Array.from(document.getElementsByTagName('meta'))
          .find((e) => e.name === 'state');
      const cache = JSON.parse( meta.getAttribute('content') || '{}');
      const data = cache [this._id];
      this.update(data);
    }
  },

  /** Redirect to given location
   * On the server: Calls res.redirect(url)
   * On the client: Calls TurboLinks.visit()
   * @param {string} url - exact location
   */
  redirect(url) {
    if (this.isClient()) {
      Turbolinks.visit(url);
    } else if (this.isServer()) {
      this.opts.req._res.redirect(url);
    }
  },

  /** Push location
   * On the server: Calls res.redirect(url)
   * On the client: Calls history.pushState({}, null, url)
   * @param {string} url - exact location
   */
  pushState(url) {
    if (this.isClient()) {
      history.pushState({}, null, url);
    } else if (this.isServer()) {
      this.opts.req._res.redirect(url);
    }
  },

  /** Replace location
   * On the server: Calls res.redirect(url)
   * On the client: Calls history.relplaceState({}, null, url)
   * @param {string} url - exact location
   */
  relplaceState(url) {
    if (this.isClient()) {
      history.relplaceState({}, null, url);
    } else if (this.isServer()) {
      this.opts.req._res.redirect(url);
    }
  },

  /** Push query
   * On the server: Calls res.redirect(url?query)
   * On the client: Calls history.pushState({}, null, url?query)
   * @param {object} query - exact location
   */
  pushQuery(query) {
    if (this.isClient()) {
      history.pushState({}, null,
          location.pathname + '?' + qs.stringify(query));
    } else if (this.isServer()) {
      this.opts.req._res.redirect(this.req.route + '?' + qs.stringify(query));
    }
  },

  /** Push query
   * On the server: Calls res.redirect(url?query)
   * On the client: Calls history.pushState({}, null, url?query)
   * @param {object} query - exact location
   */
  replaceQuery(query) {
    if (this.isClient()) {
      history.replaceState({}, null,
          window.location.pathname + '?' + qs.stringify(query));
    } else if (this.isServer()) {
      this.opts.req._res.redirect(this.req.route + '?' + qs.stringify(query));
    }
  },

  /** Get query
   * @return {object} - url query
   */
  getQuery() {
    if (this.isClient()) {
      return qs.parse(window.location.search.replace(/^\?/, ''));
    } else if (this.isServer()) {
      return this.opts.req.query;
    }
  },

  /**
   * Get root path
   * @return {string}
  */
  rootPath() {
    const path= this.isClient() ?
      Array.from(document.getElementsByTagName('meta'))
          .find((e) => e.name === 'root-path')
          .getAttribute('content') : this.opts.req.fullPath;
    return path;
  },

  $route: {
    path: '',
    params: {},
  },
  /**
   * Matches current route against a pattern.
   * @param {String} pattern - url pattern `/:var/foo/baz/:id`
   * @return {Object|Boolean}
   */
  route(pattern) {
    this.$route.path = '';
    this.$route.params = {};
    pattern = ('/' + pattern + '/').replace(/\/\//ig, '/')
        .replace(/\/\//ig, '/');;
    const request = this.isClient() ?
      location.pathname.replace(/^\//ig, '') : this.opts.req.params [0];
    let path = request.replace(this.rootPath(), '');
    path = ('/' + path + '/').replace(/\/\//ig, '/')
        .replace(/\/\//ig, '/');
    const values = path.match(/(?<=\/)(.*?)(?=\/)/g) || [];
    const keys = pattern.match(/(?<=(:|\/))(.*?)(?=\/)/g) || [];
    if (values.length != keys.length) return false;
    let result = {};
    keys.map((key, index) => {
      if (key.substr(0, 1) === ':') {
        result[key.substr(1)] = values[index];
      } else {
        result[index] = values[index];
      }
    });
    this.$route.path = path;
    this.$route.params = result;
    return result;
  },

  navigate(data, query) {
    let root = this.rootPath();
    root = ('/' + root).replace(/\/\//ig, '/');
    if (typeof data === 'string') {
      data = ('/' + data + '/').replace(/\/\//ig, '/');
      if (typeof query === 'object') {
        data += ('?' + qs.stringify(query));
      }
      if (query === true) {
        data += window.location.search;
      }
      this.pushState(root + data);
    }
  },

  href(data, query) {
    return (ev) => {
      ev.preventDefault();
      this.navigate(data, query);
    };
  },

  /**
   * Construct a component state message
   * @param {string|Object} tagContext - Uniq tag or an object containing _id
   * @param {Object} data - object with data
   * @return {Object} - `{ opts: {_id: "uniq-tag-id"}, data:{} }`
   */
  MESSAGE(tagContext, data) {
    if (typeof tagContext === 'string') {
      tagContext = {
        _t: '/m/',
        _id: tagContext,
      };
    }
    if (!tagContext) {
      tagContext = this;
    }
    return {
      opts: {
        _t: '/m/',
        _id: tagContext._id,
        ...tagContext.opts,
      },
      data,
    };
  },

  /**
   * Update a tag from context
   * @param {Object} message - an update message: `{opts:{_id: "uniq-tag-id"}, data: {}}` 
   */
  RECEIVE(message) {
    const {opts, data} = message;
    if (opts && opts._t === '/m/') {
      this.bus.trigger('update:'+opts._id, data, opts);
    }
  },

  /**
   * Update a tag from context
   * @param {Object} message - an update message: `{opts:{_id: "uniq-tag-id"}, data: {}}`
   * @return {Array} - `["tag_id", Object]`
   */
  PARSE(message) {
    const {opts, data} = message;
    if (opts && opts._t === '/m/') {
      return [opts._id, data];
    }
  },

};

export default RiotFrontLess;