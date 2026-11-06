var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.20.0/node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.20.0/node_modules/ajv-formats/dist/formats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      "date-time": fmtDef(getDateTime(true), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date(str) {
      const matches = DATE.exec(str);
      if (!matches)
        return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function compareDate(d1, d2) {
      if (!(d1 && d2))
        return void 0;
      if (d1 > d2)
        return 1;
      if (d1 < d2)
        return -1;
      return 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function time(str) {
        const matches = TIME.exec(str);
        if (!matches)
          return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === "-" ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return false;
        if (hr <= 23 && min <= 59 && sec < 60)
          return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return void 0;
      const t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf();
      const t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (!(t1 && t2))
        return void 0;
      return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2))
        return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2)
        return 1;
      if (t1 < t2)
        return -1;
      return 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time = getTime(strictTimeZone);
      return function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2))
        return void 0;
      return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0)
        return void 0;
      return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return true;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});

// validators:requests
var requests_exports = {};
__export(requests_exports, {
  createIssue: () => createIssue,
  createPullRequest: () => createPullRequest,
  getDocs: () => getDocs,
  getFiles: () => getFiles,
  getHealth: () => getHealth,
  getIssue: () => getIssue,
  getOpenApi: () => getOpenApi,
  getPullRequest: () => getPullRequest,
  getTree: () => getTree,
  listIssues: () => listIssues,
  listPullRequests: () => listPullRequests,
  updateIssue: () => updateIssue,
  upsertTreeMetadata: () => upsertTreeMetadata
});
var listIssues = validate20;
var schema31 = { "type": "object", "properties": { "path": { "type": "object", "properties": {}, "additionalProperties": false, "required": [] }, "query": { "type": "object", "properties": { "state": { "type": "string", "enum": ["open", "closed", "all"], "default": "open" }, "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }, "cursor": { "type": "string", "minLength": 1, "maxLength": 2048 } }, "additionalProperties": false, "required": [] } }, "required": ["path", "query"], "additionalProperties": false };
var func1 = require_ucs2length().default;
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate20.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          if (!(key2 === "state" || key2 === "limit" || key2 === "cursor")) {
            const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
        if (data1.state !== void 0) {
          let data2 = data1.state;
          if (typeof data2 !== "string") {
            let dataType0 = typeof data2;
            let coerced0 = void 0;
            if (!(coerced0 !== void 0)) {
              if (dataType0 == "number" || dataType0 == "boolean") {
                coerced0 = "" + data2;
              } else if (data2 === null) {
                coerced0 = "";
              } else {
                const err6 = { instancePath: instancePath + "/query/state", schemaPath: "#/properties/query/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            }
            if (coerced0 !== void 0) {
              data2 = coerced0;
              if (data1 !== void 0) {
                data1["state"] = coerced0;
              }
            }
          }
          if (!(data2 === "open" || data2 === "closed" || data2 === "all")) {
            const err7 = { instancePath: instancePath + "/query/state", schemaPath: "#/properties/query/properties/state/enum", keyword: "enum", params: { allowedValues: schema31.properties.query.properties.state.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
        if (data1.limit !== void 0) {
          let data3 = data1.limit;
          if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
            let dataType1 = typeof data3;
            let coerced1 = void 0;
            if (!(coerced1 !== void 0)) {
              if (dataType1 === "boolean" || data3 === null || dataType1 === "string" && data3 && data3 == +data3 && !(data3 % 1)) {
                coerced1 = +data3;
              } else {
                const err8 = { instancePath: instancePath + "/query/limit", schemaPath: "#/properties/query/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
            if (coerced1 !== void 0) {
              data3 = coerced1;
              if (data1 !== void 0) {
                data1["limit"] = coerced1;
              }
            }
          }
          if (typeof data3 == "number") {
            if (data3 > 100 || isNaN(data3)) {
              const err9 = { instancePath: instancePath + "/query/limit", schemaPath: "#/properties/query/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 100 }, message: "must be <= 100" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
            if (data3 < 1 || isNaN(data3)) {
              const err10 = { instancePath: instancePath + "/query/limit", schemaPath: "#/properties/query/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
          }
        }
        if (data1.cursor !== void 0) {
          let data4 = data1.cursor;
          if (typeof data4 !== "string") {
            let dataType2 = typeof data4;
            let coerced2 = void 0;
            if (!(coerced2 !== void 0)) {
              if (dataType2 == "number" || dataType2 == "boolean") {
                coerced2 = "" + data4;
              } else if (data4 === null) {
                coerced2 = "";
              } else {
                const err11 = { instancePath: instancePath + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
            }
            if (coerced2 !== void 0) {
              data4 = coerced2;
              if (data1 !== void 0) {
                data1["cursor"] = coerced2;
              }
            }
          }
          if (typeof data4 === "string") {
            if (func1(data4) > 2048) {
              const err12 = { instancePath: instancePath + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (func1(data4) < 1) {
              const err13 = { instancePath: instancePath + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
          }
        }
      } else {
        const err14 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var createIssue = validate21;
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate21.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.body === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query" || key0 === "body")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate21.errors = vErrors;
  return errors === 0;
}
validate21.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getIssue = validate22;
function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate22.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        if (data0.number === void 0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (!(key1 === "number")) {
            const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
        if (data0.number !== void 0) {
          let data1 = data0.number;
          if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
            let dataType0 = typeof data1;
            let coerced0 = void 0;
            if (!(coerced0 !== void 0)) {
              if (dataType0 === "boolean" || data1 === null || dataType0 === "string" && data1 && data1 == +data1 && !(data1 % 1)) {
                coerced0 = +data1;
              } else {
                const err5 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
            }
            if (coerced0 !== void 0) {
              data1 = coerced0;
              if (data0 !== void 0) {
                data0["number"] = coerced0;
              }
            }
          }
          if (typeof data1 == "number") {
            if (data1 > 2147483647 || isNaN(data1)) {
              const err6 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (data1 < 1 || isNaN(data1)) {
              const err7 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
        }
      } else {
        const err8 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data2 = data.query;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        for (const key2 in data2) {
          const err9 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
  } else {
    const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate22.errors = vErrors;
  return errors === 0;
}
validate22.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var updateIssue = validate23;
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate23.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.body === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query" || key0 === "body")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        if (data0.number === void 0) {
          const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (!(key1 === "number")) {
            const err5 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
        if (data0.number !== void 0) {
          let data1 = data0.number;
          if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
            let dataType0 = typeof data1;
            let coerced0 = void 0;
            if (!(coerced0 !== void 0)) {
              if (dataType0 === "boolean" || data1 === null || dataType0 === "string" && data1 && data1 == +data1 && !(data1 % 1)) {
                coerced0 = +data1;
              } else {
                const err6 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            }
            if (coerced0 !== void 0) {
              data1 = coerced0;
              if (data0 !== void 0) {
                data0["number"] = coerced0;
              }
            }
          }
          if (typeof data1 == "number") {
            if (data1 > 2147483647 || isNaN(data1)) {
              const err7 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            if (data1 < 1 || isNaN(data1)) {
              const err8 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
          }
        }
      } else {
        const err9 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data2 = data.query;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        for (const key2 in data2) {
          const err10 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
  } else {
    const err12 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err12];
    } else {
      vErrors.push(err12);
    }
    errors++;
  }
  validate23.errors = vErrors;
  return errors === 0;
}
validate23.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var listPullRequests = validate24;
var schema35 = { "type": "object", "properties": { "path": { "type": "object", "properties": {}, "additionalProperties": false, "required": [] }, "query": { "type": "object", "properties": { "state": { "type": "string", "enum": ["open", "closed", "all"], "default": "open" }, "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }, "cursor": { "type": "string", "minLength": 1, "maxLength": 2048 } }, "additionalProperties": false, "required": [] } }, "required": ["path", "query"], "additionalProperties": false };
function validate24(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate24.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          if (!(key2 === "state" || key2 === "limit" || key2 === "cursor")) {
            const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
        if (data1.state !== void 0) {
          let data2 = data1.state;
          if (typeof data2 !== "string") {
            let dataType0 = typeof data2;
            let coerced0 = void 0;
            if (!(coerced0 !== void 0)) {
              if (dataType0 == "number" || dataType0 == "boolean") {
                coerced0 = "" + data2;
              } else if (data2 === null) {
                coerced0 = "";
              } else {
                const err6 = { instancePath: instancePath + "/query/state", schemaPath: "#/properties/query/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            }
            if (coerced0 !== void 0) {
              data2 = coerced0;
              if (data1 !== void 0) {
                data1["state"] = coerced0;
              }
            }
          }
          if (!(data2 === "open" || data2 === "closed" || data2 === "all")) {
            const err7 = { instancePath: instancePath + "/query/state", schemaPath: "#/properties/query/properties/state/enum", keyword: "enum", params: { allowedValues: schema35.properties.query.properties.state.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
        if (data1.limit !== void 0) {
          let data3 = data1.limit;
          if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
            let dataType1 = typeof data3;
            let coerced1 = void 0;
            if (!(coerced1 !== void 0)) {
              if (dataType1 === "boolean" || data3 === null || dataType1 === "string" && data3 && data3 == +data3 && !(data3 % 1)) {
                coerced1 = +data3;
              } else {
                const err8 = { instancePath: instancePath + "/query/limit", schemaPath: "#/properties/query/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
            if (coerced1 !== void 0) {
              data3 = coerced1;
              if (data1 !== void 0) {
                data1["limit"] = coerced1;
              }
            }
          }
          if (typeof data3 == "number") {
            if (data3 > 100 || isNaN(data3)) {
              const err9 = { instancePath: instancePath + "/query/limit", schemaPath: "#/properties/query/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 100 }, message: "must be <= 100" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
            if (data3 < 1 || isNaN(data3)) {
              const err10 = { instancePath: instancePath + "/query/limit", schemaPath: "#/properties/query/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
          }
        }
        if (data1.cursor !== void 0) {
          let data4 = data1.cursor;
          if (typeof data4 !== "string") {
            let dataType2 = typeof data4;
            let coerced2 = void 0;
            if (!(coerced2 !== void 0)) {
              if (dataType2 == "number" || dataType2 == "boolean") {
                coerced2 = "" + data4;
              } else if (data4 === null) {
                coerced2 = "";
              } else {
                const err11 = { instancePath: instancePath + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
            }
            if (coerced2 !== void 0) {
              data4 = coerced2;
              if (data1 !== void 0) {
                data1["cursor"] = coerced2;
              }
            }
          }
          if (typeof data4 === "string") {
            if (func1(data4) > 2048) {
              const err12 = { instancePath: instancePath + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (func1(data4) < 1) {
              const err13 = { instancePath: instancePath + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
          }
        }
      } else {
        const err14 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate24.errors = vErrors;
  return errors === 0;
}
validate24.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var createPullRequest = validate25;
function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate25.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.body === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query" || key0 === "body")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate25.errors = vErrors;
  return errors === 0;
}
validate25.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getPullRequest = validate26;
function validate26(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate26.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        if (data0.number === void 0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (!(key1 === "number")) {
            const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
        if (data0.number !== void 0) {
          let data1 = data0.number;
          if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
            let dataType0 = typeof data1;
            let coerced0 = void 0;
            if (!(coerced0 !== void 0)) {
              if (dataType0 === "boolean" || data1 === null || dataType0 === "string" && data1 && data1 == +data1 && !(data1 % 1)) {
                coerced0 = +data1;
              } else {
                const err5 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
            }
            if (coerced0 !== void 0) {
              data1 = coerced0;
              if (data0 !== void 0) {
                data0["number"] = coerced0;
              }
            }
          }
          if (typeof data1 == "number") {
            if (data1 > 2147483647 || isNaN(data1)) {
              const err6 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (data1 < 1 || isNaN(data1)) {
              const err7 = { instancePath: instancePath + "/path/number", schemaPath: "#/properties/path/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
        }
      } else {
        const err8 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data2 = data.query;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        for (const key2 in data2) {
          const err9 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
  } else {
    const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate26.errors = vErrors;
  return errors === 0;
}
validate26.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getTree = validate27;
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate27.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate27.errors = vErrors;
  return errors === 0;
}
validate27.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getFiles = validate28;
function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate28.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        if (data1.path === void 0) {
          const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        for (const key2 in data1) {
          if (!(key2 === "path")) {
            const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
        }
        if (data1.path !== void 0) {
          let data2 = data1.path;
          if (Array.isArray(data2)) {
            if (data2.length > 100) {
              const err7 = { instancePath: instancePath + "/query/path", schemaPath: "#/properties/query/properties/path/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            if (data2.length < 1) {
              const err8 = { instancePath: instancePath + "/query/path", schemaPath: "#/properties/query/properties/path/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            const len0 = data2.length;
            for (let i0 = 0; i0 < len0; i0++) {
              let data3 = data2[i0];
              if (typeof data3 !== "string") {
                let dataType0 = typeof data3;
                let coerced0 = void 0;
                if (!(coerced0 !== void 0)) {
                  if (dataType0 == "number" || dataType0 == "boolean") {
                    coerced0 = "" + data3;
                  } else if (data3 === null) {
                    coerced0 = "";
                  } else {
                    const err9 = { instancePath: instancePath + "/query/path/" + i0, schemaPath: "#/properties/query/properties/path/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                    if (vErrors === null) {
                      vErrors = [err9];
                    } else {
                      vErrors.push(err9);
                    }
                    errors++;
                  }
                }
                if (coerced0 !== void 0) {
                  data3 = coerced0;
                  if (data2 !== void 0) {
                    data2[i0] = coerced0;
                  }
                }
              }
              if (typeof data3 === "string") {
                if (func1(data3) > 4096) {
                  const err10 = { instancePath: instancePath + "/query/path/" + i0, schemaPath: "#/properties/query/properties/path/items/maxLength", keyword: "maxLength", params: { limit: 4096 }, message: "must NOT have more than 4096 characters" };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                if (func1(data3) < 1) {
                  const err11 = { instancePath: instancePath + "/query/path/" + i0, schemaPath: "#/properties/query/properties/path/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
              }
            }
            let i1 = data2.length;
            let j0;
            if (i1 > 1) {
              const indices0 = {};
              for (; i1--; ) {
                let item0 = data2[i1];
                if (typeof item0 !== "string") {
                  continue;
                }
                if (typeof indices0[item0] == "number") {
                  j0 = indices0[item0];
                  const err12 = { instancePath: instancePath + "/query/path", schemaPath: "#/properties/query/properties/path/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                  break;
                }
                indices0[item0] = i1;
              }
            }
          } else {
            const err13 = { instancePath: instancePath + "/query/path", schemaPath: "#/properties/query/properties/path/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
      } else {
        const err14 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate28.errors = vErrors;
  return errors === 0;
}
validate28.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var upsertTreeMetadata = validate29;
function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate29.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.body === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query" || key0 === "body")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate29.errors = vErrors;
  return errors === 0;
}
validate29.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getOpenApi = validate30;
function validate30(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate30.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate30.errors = vErrors;
  return errors === 0;
}
validate30.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getDocs = validate31;
function validate31(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate31.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate31.errors = vErrors;
  return errors === 0;
}
validate31.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var getHealth = validate32;
function validate32(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate32.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.query === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "query")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key1 in data0) {
          const err3 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.query !== void 0) {
      let data1 = data.query;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        for (const key2 in data1) {
          const err5 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate32.errors = vErrors;
  return errors === 0;
}
validate32.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };

// validators:responses
var responses_exports = {};
__export(responses_exports, {
  body_createIssue: () => body_createIssue,
  body_createPullRequest: () => body_createPullRequest,
  body_updateIssue: () => body_updateIssue,
  body_upsertTreeMetadata: () => body_upsertTreeMetadata,
  problem: () => problem,
  response0: () => response0,
  response1: () => response1,
  response10: () => response10,
  response11: () => response11,
  response2: () => response2,
  response3: () => response3,
  response4: () => response4,
  response5: () => response5,
  response6: () => response6,
  response7: () => response7,
  response8: () => response8,
  response9: () => response9
});
var response0 = validate202;
var schema312 = { "type": "object", "additionalProperties": false, "properties": { "items": { "type": "array", "items": { "type": "object", "additionalProperties": false, "properties": { "number": { "type": "integer", "minimum": 1, "maximum": 2147483647 }, "title": { "type": "string" }, "body": { "type": ["string", "null"] }, "state": { "type": "string", "enum": ["open", "closed"] }, "url": { "type": "string", "format": "uri" }, "createdAt": { "type": "string", "format": "date-time" }, "updatedAt": { "type": "string", "format": "date-time" }, "closedAt": { "type": ["string", "null"], "format": "date-time" } }, "required": ["number", "title", "body", "state", "url", "createdAt", "updatedAt", "closedAt"] }, "maxItems": 100 }, "page": { "type": "object", "additionalProperties": false, "properties": { "nextCursor": { "type": ["string", "null"], "maxLength": 2048, "description": "\u6B21\u30DA\u30FC\u30B8\u306E\u30AB\u30FC\u30BD\u30EB\u3002\u6700\u7D42\u30DA\u30FC\u30B8\u306Fnull\u3002" } }, "required": ["nextCursor"] } }, "required": ["items", "page"] };
var formats0 = require_formats().fullFormats.uri;
var formats2 = require_formats().fullFormats["date-time"];
var func12 = require_ucs2length().default;
function validate202(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate202.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.items === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "items" }, message: "must have required property 'items'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.page === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "page" }, message: "must have required property 'page'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "items" || key0 === "page")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.items !== void 0) {
      let data0 = data.items;
      if (Array.isArray(data0)) {
        if (data0.length > 100) {
          const err3 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        const len0 = data0.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data1 = data0[i0];
          if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
            if (data1.number === void 0) {
              const err4 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data1.title === void 0) {
              const err5 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data1.body === void 0) {
              const err6 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (data1.state === void 0) {
              const err7 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            if (data1.url === void 0) {
              const err8 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (data1.createdAt === void 0) {
              const err9 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
            if (data1.updatedAt === void 0) {
              const err10 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
            if (data1.closedAt === void 0) {
              const err11 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "closedAt" }, message: "must have required property 'closedAt'" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            for (const key1 in data1) {
              if (!(key1 === "number" || key1 === "title" || key1 === "body" || key1 === "state" || key1 === "url" || key1 === "createdAt" || key1 === "updatedAt" || key1 === "closedAt")) {
                const err12 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
            }
            if (data1.number !== void 0) {
              let data2 = data1.number;
              if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
                const err13 = { instancePath: instancePath + "/items/" + i0 + "/number", schemaPath: "#/properties/items/items/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
              if (typeof data2 == "number") {
                if (data2 > 2147483647 || isNaN(data2)) {
                  const err14 = { instancePath: instancePath + "/items/" + i0 + "/number", schemaPath: "#/properties/items/items/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
                if (data2 < 1 || isNaN(data2)) {
                  const err15 = { instancePath: instancePath + "/items/" + i0 + "/number", schemaPath: "#/properties/items/items/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                  if (vErrors === null) {
                    vErrors = [err15];
                  } else {
                    vErrors.push(err15);
                  }
                  errors++;
                }
              }
            }
            if (data1.title !== void 0) {
              if (typeof data1.title !== "string") {
                const err16 = { instancePath: instancePath + "/items/" + i0 + "/title", schemaPath: "#/properties/items/items/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
            if (data1.body !== void 0) {
              let data4 = data1.body;
              if (typeof data4 !== "string" && data4 !== null) {
                const err17 = { instancePath: instancePath + "/items/" + i0 + "/body", schemaPath: "#/properties/items/items/properties/body/type", keyword: "type", params: { type: schema312.properties.items.items.properties.body.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err17];
                } else {
                  vErrors.push(err17);
                }
                errors++;
              }
            }
            if (data1.state !== void 0) {
              let data5 = data1.state;
              if (typeof data5 !== "string") {
                const err18 = { instancePath: instancePath + "/items/" + i0 + "/state", schemaPath: "#/properties/items/items/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
              if (!(data5 === "open" || data5 === "closed")) {
                const err19 = { instancePath: instancePath + "/items/" + i0 + "/state", schemaPath: "#/properties/items/items/properties/state/enum", keyword: "enum", params: { allowedValues: schema312.properties.items.items.properties.state.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
            if (data1.url !== void 0) {
              let data6 = data1.url;
              if (typeof data6 === "string") {
                if (!formats0(data6)) {
                  const err20 = { instancePath: instancePath + "/items/" + i0 + "/url", schemaPath: "#/properties/items/items/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
              } else {
                const err21 = { instancePath: instancePath + "/items/" + i0 + "/url", schemaPath: "#/properties/items/items/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
            }
            if (data1.createdAt !== void 0) {
              let data7 = data1.createdAt;
              if (typeof data7 === "string") {
                if (!formats2.validate(data7)) {
                  const err22 = { instancePath: instancePath + "/items/" + i0 + "/createdAt", schemaPath: "#/properties/items/items/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
              } else {
                const err23 = { instancePath: instancePath + "/items/" + i0 + "/createdAt", schemaPath: "#/properties/items/items/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data1.updatedAt !== void 0) {
              let data8 = data1.updatedAt;
              if (typeof data8 === "string") {
                if (!formats2.validate(data8)) {
                  const err24 = { instancePath: instancePath + "/items/" + i0 + "/updatedAt", schemaPath: "#/properties/items/items/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
              } else {
                const err25 = { instancePath: instancePath + "/items/" + i0 + "/updatedAt", schemaPath: "#/properties/items/items/properties/updatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            }
            if (data1.closedAt !== void 0) {
              let data9 = data1.closedAt;
              if (typeof data9 !== "string" && data9 !== null) {
                const err26 = { instancePath: instancePath + "/items/" + i0 + "/closedAt", schemaPath: "#/properties/items/items/properties/closedAt/type", keyword: "type", params: { type: schema312.properties.items.items.properties.closedAt.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
              if (typeof data9 === "string") {
                if (!formats2.validate(data9)) {
                  const err27 = { instancePath: instancePath + "/items/" + i0 + "/closedAt", schemaPath: "#/properties/items/items/properties/closedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
              }
            }
          } else {
            const err28 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err28];
            } else {
              vErrors.push(err28);
            }
            errors++;
          }
        }
      } else {
        const err29 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err29];
        } else {
          vErrors.push(err29);
        }
        errors++;
      }
    }
    if (data.page !== void 0) {
      let data10 = data.page;
      if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
        if (data10.nextCursor === void 0) {
          const err30 = { instancePath: instancePath + "/page", schemaPath: "#/properties/page/required", keyword: "required", params: { missingProperty: "nextCursor" }, message: "must have required property 'nextCursor'" };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
        for (const key2 in data10) {
          if (!(key2 === "nextCursor")) {
            const err31 = { instancePath: instancePath + "/page", schemaPath: "#/properties/page/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err31];
            } else {
              vErrors.push(err31);
            }
            errors++;
          }
        }
        if (data10.nextCursor !== void 0) {
          let data11 = data10.nextCursor;
          if (typeof data11 !== "string" && data11 !== null) {
            const err32 = { instancePath: instancePath + "/page/nextCursor", schemaPath: "#/properties/page/properties/nextCursor/type", keyword: "type", params: { type: schema312.properties.page.properties.nextCursor.type }, message: "must be string,null" };
            if (vErrors === null) {
              vErrors = [err32];
            } else {
              vErrors.push(err32);
            }
            errors++;
          }
          if (typeof data11 === "string") {
            if (func12(data11) > 2048) {
              const err33 = { instancePath: instancePath + "/page/nextCursor", schemaPath: "#/properties/page/properties/nextCursor/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" };
              if (vErrors === null) {
                vErrors = [err33];
              } else {
                vErrors.push(err33);
              }
              errors++;
            }
          }
        }
      } else {
        const err34 = { instancePath: instancePath + "/page", schemaPath: "#/properties/page/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err34];
        } else {
          vErrors.push(err34);
        }
        errors++;
      }
    }
  } else {
    const err35 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err35];
    } else {
      vErrors.push(err35);
    }
    errors++;
  }
  validate202.errors = vErrors;
  return errors === 0;
}
validate202.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response1 = validate212;
var schema32 = { "type": "object", "required": ["type", "title", "status", "detail", "instance", "code"], "properties": { "type": { "type": "string", "format": "uri" }, "title": { "type": "string" }, "status": { "type": "integer", "minimum": 400, "maximum": 599 }, "detail": { "type": "string", "description": "\u30A8\u30E9\u30FC\u306E\u8A73\u7D30\u3002" }, "instance": { "type": "string", "format": "uri-reference", "description": "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u305F\u30EA\u30AF\u30A8\u30B9\u30C8\u306E\u30D1\u30B9\u3002" }, "code": { "type": "string", "enum": ["INVALID_REQUEST", "INVALID_CURSOR", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "METHOD_NOT_ALLOWED", "NOT_ACCEPTABLE", "CONFLICT", "REPLAY_DETECTED", "PAYLOAD_TOO_LARGE", "URI_TOO_LONG", "UNSUPPORTED_MEDIA_TYPE", "UNPROCESSABLE_CONTENT", "SNAPSHOT_LIMIT_EXCEEDED", "RATE_LIMITED", "INTERNAL_ERROR", "UPSTREAM_ERROR", "SERVICE_UNAVAILABLE"] } }, "additionalProperties": true, "description": "RFC 9457\u5F62\u5F0F\u306E\u30A8\u30E9\u30FC\u60C5\u5831\u3002" };
var formats10 = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function validate212(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate212.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.type === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.status === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.detail === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "detail" }, message: "must have required property 'detail'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.instance === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "instance" }, message: "must have required property 'instance'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.code === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.type !== void 0) {
      let data0 = data.type;
      if (typeof data0 === "string") {
        if (!formats0(data0)) {
          const err6 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.title !== void 0) {
      if (typeof data.title !== "string") {
        const err8 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      let data2 = data.status;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err9 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 > 599 || isNaN(data2)) {
          const err10 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/maximum", keyword: "maximum", params: { comparison: "<=", limit: 599 }, message: "must be <= 599" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (data2 < 400 || isNaN(data2)) {
          const err11 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/minimum", keyword: "minimum", params: { comparison: ">=", limit: 400 }, message: "must be >= 400" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
    }
    if (data.detail !== void 0) {
      if (typeof data.detail !== "string") {
        const err12 = { instancePath: instancePath + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.instance !== void 0) {
      let data4 = data.instance;
      if (typeof data4 === "string") {
        if (!formats10.test(data4)) {
          const err13 = { instancePath: instancePath + "/instance", schemaPath: "#/properties/instance/format", keyword: "format", params: { format: "uri-reference" }, message: 'must match format "uri-reference"' };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/instance", schemaPath: "#/properties/instance/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.code !== void 0) {
      let data5 = data.code;
      if (typeof data5 !== "string") {
        const err15 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
      if (!(data5 === "INVALID_REQUEST" || data5 === "INVALID_CURSOR" || data5 === "UNAUTHENTICATED" || data5 === "FORBIDDEN" || data5 === "NOT_FOUND" || data5 === "METHOD_NOT_ALLOWED" || data5 === "NOT_ACCEPTABLE" || data5 === "CONFLICT" || data5 === "REPLAY_DETECTED" || data5 === "PAYLOAD_TOO_LARGE" || data5 === "URI_TOO_LONG" || data5 === "UNSUPPORTED_MEDIA_TYPE" || data5 === "UNPROCESSABLE_CONTENT" || data5 === "SNAPSHOT_LIMIT_EXCEEDED" || data5 === "RATE_LIMITED" || data5 === "INTERNAL_ERROR" || data5 === "UPSTREAM_ERROR" || data5 === "SERVICE_UNAVAILABLE")) {
        const err16 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/enum", keyword: "enum", params: { allowedValues: schema32.properties.code.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  } else {
    const err17 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err17];
    } else {
      vErrors.push(err17);
    }
    errors++;
  }
  validate212.errors = vErrors;
  return errors === 0;
}
validate212.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var body_createIssue = validate222;
function validate222(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate222.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.title === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "title" || key0 === "body" || key0 === "labels" || key0 === "assignees")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.title !== void 0) {
      let data0 = data.title;
      if (typeof data0 === "string") {
        if (func12(data0) > 256) {
          const err2 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/maxLength", keyword: "maxLength", params: { limit: 256 }, message: "must NOT have more than 256 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (func12(data0) < 1) {
          const err3 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.body !== void 0) {
      let data1 = data.body;
      if (typeof data1 === "string") {
        if (func12(data1) > 65536) {
          const err5 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/maxLength", keyword: "maxLength", params: { limit: 65536 }, message: "must NOT have more than 65536 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.labels !== void 0) {
      let data2 = data.labels;
      if (Array.isArray(data2)) {
        if (data2.length > 20) {
          const err7 = { instancePath: instancePath + "/labels", schemaPath: "#/properties/labels/maxItems", keyword: "maxItems", params: { limit: 20 }, message: "must NOT have more than 20 items" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        const len0 = data2.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data3 = data2[i0];
          if (typeof data3 === "string") {
            if (func12(data3) > 50) {
              const err8 = { instancePath: instancePath + "/labels/" + i0, schemaPath: "#/properties/labels/items/maxLength", keyword: "maxLength", params: { limit: 50 }, message: "must NOT have more than 50 characters" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (func12(data3) < 1) {
              const err9 = { instancePath: instancePath + "/labels/" + i0, schemaPath: "#/properties/labels/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
          } else {
            const err10 = { instancePath: instancePath + "/labels/" + i0, schemaPath: "#/properties/labels/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        }
        let i1 = data2.length;
        let j0;
        if (i1 > 1) {
          const indices0 = {};
          for (; i1--; ) {
            let item0 = data2[i1];
            if (typeof item0 !== "string") {
              continue;
            }
            if (typeof indices0[item0] == "number") {
              j0 = indices0[item0];
              const err11 = { instancePath: instancePath + "/labels", schemaPath: "#/properties/labels/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
              break;
            }
            indices0[item0] = i1;
          }
        }
      } else {
        const err12 = { instancePath: instancePath + "/labels", schemaPath: "#/properties/labels/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.assignees !== void 0) {
      let data4 = data.assignees;
      if (Array.isArray(data4)) {
        if (data4.length > 10) {
          const err13 = { instancePath: instancePath + "/assignees", schemaPath: "#/properties/assignees/maxItems", keyword: "maxItems", params: { limit: 10 }, message: "must NOT have more than 10 items" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        const len1 = data4.length;
        for (let i2 = 0; i2 < len1; i2++) {
          let data5 = data4[i2];
          if (typeof data5 === "string") {
            if (func12(data5) > 39) {
              const err14 = { instancePath: instancePath + "/assignees/" + i2, schemaPath: "#/properties/assignees/items/maxLength", keyword: "maxLength", params: { limit: 39 }, message: "must NOT have more than 39 characters" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func12(data5) < 1) {
              const err15 = { instancePath: instancePath + "/assignees/" + i2, schemaPath: "#/properties/assignees/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = { instancePath: instancePath + "/assignees/" + i2, schemaPath: "#/properties/assignees/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        let i3 = data4.length;
        let j1;
        if (i3 > 1) {
          const indices1 = {};
          for (; i3--; ) {
            let item1 = data4[i3];
            if (typeof item1 !== "string") {
              continue;
            }
            if (typeof indices1[item1] == "number") {
              j1 = indices1[item1];
              const err17 = { instancePath: instancePath + "/assignees", schemaPath: "#/properties/assignees/uniqueItems", keyword: "uniqueItems", params: { i: i3, j: j1 }, message: "must NOT have duplicate items (items ## " + j1 + " and " + i3 + " are identical)" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
              break;
            }
            indices1[item1] = i3;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/assignees", schemaPath: "#/properties/assignees/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
  } else {
    const err19 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate222.errors = vErrors;
  return errors === 0;
}
validate222.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response2 = validate232;
var schema34 = { "type": "object", "additionalProperties": false, "properties": { "number": { "type": "integer", "minimum": 1, "maximum": 2147483647 }, "title": { "type": "string" }, "body": { "type": ["string", "null"] }, "state": { "type": "string", "enum": ["open", "closed"] }, "url": { "type": "string", "format": "uri" }, "createdAt": { "type": "string", "format": "date-time" }, "updatedAt": { "type": "string", "format": "date-time" }, "closedAt": { "type": ["string", "null"], "format": "date-time" } }, "required": ["number", "title", "body", "state", "url", "createdAt", "updatedAt", "closedAt"] };
function validate232(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate232.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.number === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.body === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.state === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.url === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.createdAt === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.updatedAt === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.closedAt === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "closedAt" }, message: "must have required property 'closedAt'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "number" || key0 === "title" || key0 === "body" || key0 === "state" || key0 === "url" || key0 === "createdAt" || key0 === "updatedAt" || key0 === "closedAt")) {
        const err8 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.number !== void 0) {
      let data0 = data.number;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err9 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 > 2147483647 || isNaN(data0)) {
          const err10 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (data0 < 1 || isNaN(data0)) {
          const err11 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
    }
    if (data.title !== void 0) {
      if (typeof data.title !== "string") {
        const err12 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.body !== void 0) {
      let data2 = data.body;
      if (typeof data2 !== "string" && data2 !== null) {
        const err13 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: schema34.properties.body.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.state !== void 0) {
      let data3 = data.state;
      if (typeof data3 !== "string") {
        const err14 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
      if (!(data3 === "open" || data3 === "closed")) {
        const err15 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/enum", keyword: "enum", params: { allowedValues: schema34.properties.state.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.url !== void 0) {
      let data4 = data.url;
      if (typeof data4 === "string") {
        if (!formats0(data4)) {
          const err16 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
      } else {
        const err17 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.createdAt !== void 0) {
      let data5 = data.createdAt;
      if (typeof data5 === "string") {
        if (!formats2.validate(data5)) {
          const err18 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
      } else {
        const err19 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
    if (data.updatedAt !== void 0) {
      let data6 = data.updatedAt;
      if (typeof data6 === "string") {
        if (!formats2.validate(data6)) {
          const err20 = { instancePath: instancePath + "/updatedAt", schemaPath: "#/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
      } else {
        const err21 = { instancePath: instancePath + "/updatedAt", schemaPath: "#/properties/updatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
    if (data.closedAt !== void 0) {
      let data7 = data.closedAt;
      if (typeof data7 !== "string" && data7 !== null) {
        const err22 = { instancePath: instancePath + "/closedAt", schemaPath: "#/properties/closedAt/type", keyword: "type", params: { type: schema34.properties.closedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
      if (typeof data7 === "string") {
        if (!formats2.validate(data7)) {
          const err23 = { instancePath: instancePath + "/closedAt", schemaPath: "#/properties/closedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err23];
          } else {
            vErrors.push(err23);
          }
          errors++;
        }
      }
    }
  } else {
    const err24 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err24];
    } else {
      vErrors.push(err24);
    }
    errors++;
  }
  validate232.errors = vErrors;
  return errors === 0;
}
validate232.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var body_updateIssue = validate242;
function validate242(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate242.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (Object.keys(data).length < 1) {
      const err0 = { instancePath, schemaPath: "#/minProperties", keyword: "minProperties", params: { limit: 1 }, message: "must NOT have fewer than 1 properties" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "title" || key0 === "body")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.title !== void 0) {
      let data0 = data.title;
      if (typeof data0 === "string") {
        if (func12(data0) > 256) {
          const err2 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/maxLength", keyword: "maxLength", params: { limit: 256 }, message: "must NOT have more than 256 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (func12(data0) < 1) {
          const err3 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.body !== void 0) {
      let data1 = data.body;
      if (typeof data1 === "string") {
        if (func12(data1) > 65536) {
          const err5 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/maxLength", keyword: "maxLength", params: { limit: 65536 }, message: "must NOT have more than 65536 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate242.errors = vErrors;
  return errors === 0;
}
validate242.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response3 = validate252;
var schema36 = { "type": "object", "additionalProperties": false, "properties": { "items": { "type": "array", "items": { "type": "object", "additionalProperties": false, "properties": { "number": { "type": "integer", "minimum": 1, "maximum": 2147483647 }, "title": { "type": "string" }, "body": { "type": ["string", "null"] }, "state": { "type": "string", "enum": ["open", "closed"] }, "url": { "type": "string", "format": "uri" }, "createdAt": { "type": "string", "format": "date-time" }, "updatedAt": { "type": "string", "format": "date-time" }, "closedAt": { "type": ["string", "null"], "format": "date-time" }, "draft": { "type": "boolean" }, "merged": { "type": "boolean" }, "mergedAt": { "type": ["string", "null"], "format": "date-time" }, "headBranch": { "type": "string" }, "baseBranch": { "type": "string" }, "headSha": { "type": "string", "pattern": "^[0-9a-f]{40}([0-9a-f]{24})?$" } }, "required": ["number", "title", "body", "state", "url", "createdAt", "updatedAt", "closedAt", "draft", "merged", "mergedAt", "headBranch", "baseBranch", "headSha"] }, "maxItems": 100 }, "page": { "type": "object", "additionalProperties": false, "properties": { "nextCursor": { "type": ["string", "null"], "maxLength": 2048, "description": "\u6B21\u30DA\u30FC\u30B8\u306E\u30AB\u30FC\u30BD\u30EB\u3002\u6700\u7D42\u30DA\u30FC\u30B8\u306Fnull\u3002" } }, "required": ["nextCursor"] } }, "required": ["items", "page"] };
var func122 = Object.prototype.hasOwnProperty;
var pattern4 = new RegExp("^[0-9a-f]{40}([0-9a-f]{24})?$", "u");
function validate252(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate252.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.items === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "items" }, message: "must have required property 'items'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.page === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "page" }, message: "must have required property 'page'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "items" || key0 === "page")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.items !== void 0) {
      let data0 = data.items;
      if (Array.isArray(data0)) {
        if (data0.length > 100) {
          const err3 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        const len0 = data0.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data1 = data0[i0];
          if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
            if (data1.number === void 0) {
              const err4 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data1.title === void 0) {
              const err5 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data1.body === void 0) {
              const err6 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (data1.state === void 0) {
              const err7 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            if (data1.url === void 0) {
              const err8 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (data1.createdAt === void 0) {
              const err9 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
            if (data1.updatedAt === void 0) {
              const err10 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
            if (data1.closedAt === void 0) {
              const err11 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "closedAt" }, message: "must have required property 'closedAt'" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            if (data1.draft === void 0) {
              const err12 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "draft" }, message: "must have required property 'draft'" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (data1.merged === void 0) {
              const err13 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "merged" }, message: "must have required property 'merged'" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (data1.mergedAt === void 0) {
              const err14 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "mergedAt" }, message: "must have required property 'mergedAt'" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (data1.headBranch === void 0) {
              const err15 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "headBranch" }, message: "must have required property 'headBranch'" };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data1.baseBranch === void 0) {
              const err16 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "baseBranch" }, message: "must have required property 'baseBranch'" };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data1.headSha === void 0) {
              const err17 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "headSha" }, message: "must have required property 'headSha'" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            for (const key1 in data1) {
              if (!func122.call(schema36.properties.items.items.properties, key1)) {
                const err18 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            if (data1.number !== void 0) {
              let data2 = data1.number;
              if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
                const err19 = { instancePath: instancePath + "/items/" + i0 + "/number", schemaPath: "#/properties/items/items/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
              if (typeof data2 == "number") {
                if (data2 > 2147483647 || isNaN(data2)) {
                  const err20 = { instancePath: instancePath + "/items/" + i0 + "/number", schemaPath: "#/properties/items/items/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
                if (data2 < 1 || isNaN(data2)) {
                  const err21 = { instancePath: instancePath + "/items/" + i0 + "/number", schemaPath: "#/properties/items/items/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              }
            }
            if (data1.title !== void 0) {
              if (typeof data1.title !== "string") {
                const err22 = { instancePath: instancePath + "/items/" + i0 + "/title", schemaPath: "#/properties/items/items/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            if (data1.body !== void 0) {
              let data4 = data1.body;
              if (typeof data4 !== "string" && data4 !== null) {
                const err23 = { instancePath: instancePath + "/items/" + i0 + "/body", schemaPath: "#/properties/items/items/properties/body/type", keyword: "type", params: { type: schema36.properties.items.items.properties.body.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data1.state !== void 0) {
              let data5 = data1.state;
              if (typeof data5 !== "string") {
                const err24 = { instancePath: instancePath + "/items/" + i0 + "/state", schemaPath: "#/properties/items/items/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
              if (!(data5 === "open" || data5 === "closed")) {
                const err25 = { instancePath: instancePath + "/items/" + i0 + "/state", schemaPath: "#/properties/items/items/properties/state/enum", keyword: "enum", params: { allowedValues: schema36.properties.items.items.properties.state.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            }
            if (data1.url !== void 0) {
              let data6 = data1.url;
              if (typeof data6 === "string") {
                if (!formats0(data6)) {
                  const err26 = { instancePath: instancePath + "/items/" + i0 + "/url", schemaPath: "#/properties/items/items/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
                  if (vErrors === null) {
                    vErrors = [err26];
                  } else {
                    vErrors.push(err26);
                  }
                  errors++;
                }
              } else {
                const err27 = { instancePath: instancePath + "/items/" + i0 + "/url", schemaPath: "#/properties/items/items/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err27];
                } else {
                  vErrors.push(err27);
                }
                errors++;
              }
            }
            if (data1.createdAt !== void 0) {
              let data7 = data1.createdAt;
              if (typeof data7 === "string") {
                if (!formats2.validate(data7)) {
                  const err28 = { instancePath: instancePath + "/items/" + i0 + "/createdAt", schemaPath: "#/properties/items/items/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err28];
                  } else {
                    vErrors.push(err28);
                  }
                  errors++;
                }
              } else {
                const err29 = { instancePath: instancePath + "/items/" + i0 + "/createdAt", schemaPath: "#/properties/items/items/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err29];
                } else {
                  vErrors.push(err29);
                }
                errors++;
              }
            }
            if (data1.updatedAt !== void 0) {
              let data8 = data1.updatedAt;
              if (typeof data8 === "string") {
                if (!formats2.validate(data8)) {
                  const err30 = { instancePath: instancePath + "/items/" + i0 + "/updatedAt", schemaPath: "#/properties/items/items/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err30];
                  } else {
                    vErrors.push(err30);
                  }
                  errors++;
                }
              } else {
                const err31 = { instancePath: instancePath + "/items/" + i0 + "/updatedAt", schemaPath: "#/properties/items/items/properties/updatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err31];
                } else {
                  vErrors.push(err31);
                }
                errors++;
              }
            }
            if (data1.closedAt !== void 0) {
              let data9 = data1.closedAt;
              if (typeof data9 !== "string" && data9 !== null) {
                const err32 = { instancePath: instancePath + "/items/" + i0 + "/closedAt", schemaPath: "#/properties/items/items/properties/closedAt/type", keyword: "type", params: { type: schema36.properties.items.items.properties.closedAt.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err32];
                } else {
                  vErrors.push(err32);
                }
                errors++;
              }
              if (typeof data9 === "string") {
                if (!formats2.validate(data9)) {
                  const err33 = { instancePath: instancePath + "/items/" + i0 + "/closedAt", schemaPath: "#/properties/items/items/properties/closedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err33];
                  } else {
                    vErrors.push(err33);
                  }
                  errors++;
                }
              }
            }
            if (data1.draft !== void 0) {
              if (typeof data1.draft !== "boolean") {
                const err34 = { instancePath: instancePath + "/items/" + i0 + "/draft", schemaPath: "#/properties/items/items/properties/draft/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                if (vErrors === null) {
                  vErrors = [err34];
                } else {
                  vErrors.push(err34);
                }
                errors++;
              }
            }
            if (data1.merged !== void 0) {
              if (typeof data1.merged !== "boolean") {
                const err35 = { instancePath: instancePath + "/items/" + i0 + "/merged", schemaPath: "#/properties/items/items/properties/merged/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                if (vErrors === null) {
                  vErrors = [err35];
                } else {
                  vErrors.push(err35);
                }
                errors++;
              }
            }
            if (data1.mergedAt !== void 0) {
              let data12 = data1.mergedAt;
              if (typeof data12 !== "string" && data12 !== null) {
                const err36 = { instancePath: instancePath + "/items/" + i0 + "/mergedAt", schemaPath: "#/properties/items/items/properties/mergedAt/type", keyword: "type", params: { type: schema36.properties.items.items.properties.mergedAt.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err36];
                } else {
                  vErrors.push(err36);
                }
                errors++;
              }
              if (typeof data12 === "string") {
                if (!formats2.validate(data12)) {
                  const err37 = { instancePath: instancePath + "/items/" + i0 + "/mergedAt", schemaPath: "#/properties/items/items/properties/mergedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err37];
                  } else {
                    vErrors.push(err37);
                  }
                  errors++;
                }
              }
            }
            if (data1.headBranch !== void 0) {
              if (typeof data1.headBranch !== "string") {
                const err38 = { instancePath: instancePath + "/items/" + i0 + "/headBranch", schemaPath: "#/properties/items/items/properties/headBranch/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err38];
                } else {
                  vErrors.push(err38);
                }
                errors++;
              }
            }
            if (data1.baseBranch !== void 0) {
              if (typeof data1.baseBranch !== "string") {
                const err39 = { instancePath: instancePath + "/items/" + i0 + "/baseBranch", schemaPath: "#/properties/items/items/properties/baseBranch/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err39];
                } else {
                  vErrors.push(err39);
                }
                errors++;
              }
            }
            if (data1.headSha !== void 0) {
              let data15 = data1.headSha;
              if (typeof data15 === "string") {
                if (!pattern4.test(data15)) {
                  const err40 = { instancePath: instancePath + "/items/" + i0 + "/headSha", schemaPath: "#/properties/items/items/properties/headSha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
                  if (vErrors === null) {
                    vErrors = [err40];
                  } else {
                    vErrors.push(err40);
                  }
                  errors++;
                }
              } else {
                const err41 = { instancePath: instancePath + "/items/" + i0 + "/headSha", schemaPath: "#/properties/items/items/properties/headSha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err41];
                } else {
                  vErrors.push(err41);
                }
                errors++;
              }
            }
          } else {
            const err42 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err42];
            } else {
              vErrors.push(err42);
            }
            errors++;
          }
        }
      } else {
        const err43 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err43];
        } else {
          vErrors.push(err43);
        }
        errors++;
      }
    }
    if (data.page !== void 0) {
      let data16 = data.page;
      if (data16 && typeof data16 == "object" && !Array.isArray(data16)) {
        if (data16.nextCursor === void 0) {
          const err44 = { instancePath: instancePath + "/page", schemaPath: "#/properties/page/required", keyword: "required", params: { missingProperty: "nextCursor" }, message: "must have required property 'nextCursor'" };
          if (vErrors === null) {
            vErrors = [err44];
          } else {
            vErrors.push(err44);
          }
          errors++;
        }
        for (const key2 in data16) {
          if (!(key2 === "nextCursor")) {
            const err45 = { instancePath: instancePath + "/page", schemaPath: "#/properties/page/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err45];
            } else {
              vErrors.push(err45);
            }
            errors++;
          }
        }
        if (data16.nextCursor !== void 0) {
          let data17 = data16.nextCursor;
          if (typeof data17 !== "string" && data17 !== null) {
            const err46 = { instancePath: instancePath + "/page/nextCursor", schemaPath: "#/properties/page/properties/nextCursor/type", keyword: "type", params: { type: schema36.properties.page.properties.nextCursor.type }, message: "must be string,null" };
            if (vErrors === null) {
              vErrors = [err46];
            } else {
              vErrors.push(err46);
            }
            errors++;
          }
          if (typeof data17 === "string") {
            if (func12(data17) > 2048) {
              const err47 = { instancePath: instancePath + "/page/nextCursor", schemaPath: "#/properties/page/properties/nextCursor/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" };
              if (vErrors === null) {
                vErrors = [err47];
              } else {
                vErrors.push(err47);
              }
              errors++;
            }
          }
        }
      } else {
        const err48 = { instancePath: instancePath + "/page", schemaPath: "#/properties/page/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err48];
        } else {
          vErrors.push(err48);
        }
        errors++;
      }
    }
  } else {
    const err49 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err49];
    } else {
      vErrors.push(err49);
    }
    errors++;
  }
  validate252.errors = vErrors;
  return errors === 0;
}
validate252.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var body_createPullRequest = validate262;
function validate262(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate262.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.prTitle === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "prTitle" }, message: "must have required property 'prTitle'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.branchName === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "branchName" }, message: "must have required property 'branchName'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.files === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "files" }, message: "must have required property 'files'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "prTitle" || key0 === "prBody" || key0 === "branchName" || key0 === "commitMessage" || key0 === "files")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.prTitle !== void 0) {
      let data0 = data.prTitle;
      if (typeof data0 === "string") {
        if (func12(data0) > 256) {
          const err4 = { instancePath: instancePath + "/prTitle", schemaPath: "#/properties/prTitle/maxLength", keyword: "maxLength", params: { limit: 256 }, message: "must NOT have more than 256 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (func12(data0) < 1) {
          const err5 = { instancePath: instancePath + "/prTitle", schemaPath: "#/properties/prTitle/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/prTitle", schemaPath: "#/properties/prTitle/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.prBody !== void 0) {
      let data1 = data.prBody;
      if (typeof data1 === "string") {
        if (func12(data1) > 65536) {
          const err7 = { instancePath: instancePath + "/prBody", schemaPath: "#/properties/prBody/maxLength", keyword: "maxLength", params: { limit: 65536 }, message: "must NOT have more than 65536 characters" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/prBody", schemaPath: "#/properties/prBody/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.branchName !== void 0) {
      let data2 = data.branchName;
      if (typeof data2 === "string") {
        if (func12(data2) > 255) {
          const err9 = { instancePath: instancePath + "/branchName", schemaPath: "#/properties/branchName/maxLength", keyword: "maxLength", params: { limit: 255 }, message: "must NOT have more than 255 characters" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (func12(data2) < 1) {
          const err10 = { instancePath: instancePath + "/branchName", schemaPath: "#/properties/branchName/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/branchName", schemaPath: "#/properties/branchName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.commitMessage !== void 0) {
      let data3 = data.commitMessage;
      if (typeof data3 === "string") {
        if (func12(data3) > 65536) {
          const err12 = { instancePath: instancePath + "/commitMessage", schemaPath: "#/properties/commitMessage/maxLength", keyword: "maxLength", params: { limit: 65536 }, message: "must NOT have more than 65536 characters" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (func12(data3) < 1) {
          const err13 = { instancePath: instancePath + "/commitMessage", schemaPath: "#/properties/commitMessage/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/commitMessage", schemaPath: "#/properties/commitMessage/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.files !== void 0) {
      let data4 = data.files;
      if (Array.isArray(data4)) {
        if (data4.length > 100) {
          const err15 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        if (data4.length < 1) {
          const err16 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        const len0 = data4.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data5 = data4[i0];
          const _errs13 = errors;
          let valid3 = false;
          let passing0 = null;
          const _errs14 = errors;
          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
            if (data5.path === void 0) {
              const err17 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/0/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (data5.content === void 0) {
              const err18 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/0/required", keyword: "required", params: { missingProperty: "content" }, message: "must have required property 'content'" };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            for (const key1 in data5) {
              if (!(key1 === "path" || key1 === "operation" || key1 === "content")) {
                const err19 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
            if (data5.path !== void 0) {
              let data6 = data5.path;
              if (typeof data6 === "string") {
                if (func12(data6) > 4096) {
                  const err20 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/oneOf/0/properties/path/maxLength", keyword: "maxLength", params: { limit: 4096 }, message: "must NOT have more than 4096 characters" };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
                if (func12(data6) < 1) {
                  const err21 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/oneOf/0/properties/path/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              } else {
                const err22 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/oneOf/0/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            if (data5.operation !== void 0) {
              let data7 = data5.operation;
              if (typeof data7 !== "string") {
                const err23 = { instancePath: instancePath + "/files/" + i0 + "/operation", schemaPath: "#/properties/files/items/oneOf/0/properties/operation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
              if ("upsert" !== data7) {
                const err24 = { instancePath: instancePath + "/files/" + i0 + "/operation", schemaPath: "#/properties/files/items/oneOf/0/properties/operation/const", keyword: "const", params: { allowedValue: "upsert" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
            }
            if (data5.content !== void 0) {
              let data8 = data5.content;
              if (typeof data8 === "string") {
                if (func12(data8) > 1048576) {
                  const err25 = { instancePath: instancePath + "/files/" + i0 + "/content", schemaPath: "#/properties/files/items/oneOf/0/properties/content/maxLength", keyword: "maxLength", params: { limit: 1048576 }, message: "must NOT have more than 1048576 characters" };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
              } else {
                const err26 = { instancePath: instancePath + "/files/" + i0 + "/content", schemaPath: "#/properties/files/items/oneOf/0/properties/content/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
            }
          } else {
            const err27 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
          var _valid0 = _errs14 === errors;
          if (_valid0) {
            valid3 = true;
            passing0 = 0;
            var props0 = true;
          }
          const _errs23 = errors;
          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
            if (data5.path === void 0) {
              const err28 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/1/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
              if (vErrors === null) {
                vErrors = [err28];
              } else {
                vErrors.push(err28);
              }
              errors++;
            }
            if (data5.operation === void 0) {
              const err29 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/1/required", keyword: "required", params: { missingProperty: "operation" }, message: "must have required property 'operation'" };
              if (vErrors === null) {
                vErrors = [err29];
              } else {
                vErrors.push(err29);
              }
              errors++;
            }
            for (const key2 in data5) {
              if (!(key2 === "path" || key2 === "operation")) {
                const err30 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err30];
                } else {
                  vErrors.push(err30);
                }
                errors++;
              }
            }
            if (data5.path !== void 0) {
              let data9 = data5.path;
              if (typeof data9 === "string") {
                if (func12(data9) > 4096) {
                  const err31 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/oneOf/1/properties/path/maxLength", keyword: "maxLength", params: { limit: 4096 }, message: "must NOT have more than 4096 characters" };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
                if (func12(data9) < 1) {
                  const err32 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/oneOf/1/properties/path/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err32];
                  } else {
                    vErrors.push(err32);
                  }
                  errors++;
                }
              } else {
                const err33 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/oneOf/1/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err33];
                } else {
                  vErrors.push(err33);
                }
                errors++;
              }
            }
            if (data5.operation !== void 0) {
              let data10 = data5.operation;
              if (typeof data10 !== "string") {
                const err34 = { instancePath: instancePath + "/files/" + i0 + "/operation", schemaPath: "#/properties/files/items/oneOf/1/properties/operation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err34];
                } else {
                  vErrors.push(err34);
                }
                errors++;
              }
              if ("delete" !== data10) {
                const err35 = { instancePath: instancePath + "/files/" + i0 + "/operation", schemaPath: "#/properties/files/items/oneOf/1/properties/operation/const", keyword: "const", params: { allowedValue: "delete" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err35];
                } else {
                  vErrors.push(err35);
                }
                errors++;
              }
            }
          } else {
            const err36 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err36];
            } else {
              vErrors.push(err36);
            }
            errors++;
          }
          var _valid0 = _errs23 === errors;
          if (_valid0 && valid3) {
            valid3 = false;
            passing0 = [passing0, 1];
          } else {
            if (_valid0) {
              valid3 = true;
              passing0 = 1;
              if (props0 !== true) {
                props0 = true;
              }
            }
          }
          if (!valid3) {
            const err37 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
            if (vErrors === null) {
              vErrors = [err37];
            } else {
              vErrors.push(err37);
            }
            errors++;
          } else {
            errors = _errs13;
            if (vErrors !== null) {
              if (_errs13) {
                vErrors.length = _errs13;
              } else {
                vErrors = null;
              }
            }
          }
        }
      } else {
        const err38 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err38];
        } else {
          vErrors.push(err38);
        }
        errors++;
      }
    }
  } else {
    const err39 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err39];
    } else {
      vErrors.push(err39);
    }
    errors++;
  }
  validate262.errors = vErrors;
  return errors === 0;
}
validate262.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response4 = validate272;
function validate272(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate272.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.number === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.url === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.branchName === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "branchName" }, message: "must have required property 'branchName'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.commitSha === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "commitSha" }, message: "must have required property 'commitSha'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.reused === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "reused" }, message: "must have required property 'reused'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "number" || key0 === "url" || key0 === "branchName" || key0 === "commitSha" || key0 === "reused")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.number !== void 0) {
      let data0 = data.number;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err6 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 > 2147483647 || isNaN(data0)) {
          const err7 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        if (data0 < 1 || isNaN(data0)) {
          const err8 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
    }
    if (data.url !== void 0) {
      let data1 = data.url;
      if (typeof data1 === "string") {
        if (!formats0(data1)) {
          const err9 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.branchName !== void 0) {
      if (typeof data.branchName !== "string") {
        const err11 = { instancePath: instancePath + "/branchName", schemaPath: "#/properties/branchName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.commitSha !== void 0) {
      let data3 = data.commitSha;
      if (typeof data3 === "string") {
        if (!pattern4.test(data3)) {
          const err12 = { instancePath: instancePath + "/commitSha", schemaPath: "#/properties/commitSha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/commitSha", schemaPath: "#/properties/commitSha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.reused !== void 0) {
      if (typeof data.reused !== "boolean") {
        const err14 = { instancePath: instancePath + "/reused", schemaPath: "#/properties/reused/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate272.errors = vErrors;
  return errors === 0;
}
validate272.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response5 = validate282;
var schema39 = { "type": "object", "additionalProperties": false, "properties": { "number": { "type": "integer", "minimum": 1, "maximum": 2147483647 }, "title": { "type": "string" }, "body": { "type": ["string", "null"] }, "state": { "type": "string", "enum": ["open", "closed"] }, "url": { "type": "string", "format": "uri" }, "createdAt": { "type": "string", "format": "date-time" }, "updatedAt": { "type": "string", "format": "date-time" }, "closedAt": { "type": ["string", "null"], "format": "date-time" }, "draft": { "type": "boolean" }, "merged": { "type": "boolean" }, "mergedAt": { "type": ["string", "null"], "format": "date-time" }, "headBranch": { "type": "string" }, "baseBranch": { "type": "string" }, "headSha": { "type": "string", "pattern": "^[0-9a-f]{40}([0-9a-f]{24})?$" } }, "required": ["number", "title", "body", "state", "url", "createdAt", "updatedAt", "closedAt", "draft", "merged", "mergedAt", "headBranch", "baseBranch", "headSha"] };
function validate282(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate282.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.number === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "number" }, message: "must have required property 'number'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.body === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.state === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.url === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.createdAt === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.updatedAt === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.closedAt === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "closedAt" }, message: "must have required property 'closedAt'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.draft === void 0) {
      const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "draft" }, message: "must have required property 'draft'" };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
    if (data.merged === void 0) {
      const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "merged" }, message: "must have required property 'merged'" };
      if (vErrors === null) {
        vErrors = [err9];
      } else {
        vErrors.push(err9);
      }
      errors++;
    }
    if (data.mergedAt === void 0) {
      const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "mergedAt" }, message: "must have required property 'mergedAt'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.headBranch === void 0) {
      const err11 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "headBranch" }, message: "must have required property 'headBranch'" };
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
    if (data.baseBranch === void 0) {
      const err12 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "baseBranch" }, message: "must have required property 'baseBranch'" };
      if (vErrors === null) {
        vErrors = [err12];
      } else {
        vErrors.push(err12);
      }
      errors++;
    }
    if (data.headSha === void 0) {
      const err13 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "headSha" }, message: "must have required property 'headSha'" };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func122.call(schema39.properties, key0)) {
        const err14 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.number !== void 0) {
      let data0 = data.number;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err15 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 > 2147483647 || isNaN(data0)) {
          const err16 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        if (data0 < 1 || isNaN(data0)) {
          const err17 = { instancePath: instancePath + "/number", schemaPath: "#/properties/number/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
      }
    }
    if (data.title !== void 0) {
      if (typeof data.title !== "string") {
        const err18 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.body !== void 0) {
      let data2 = data.body;
      if (typeof data2 !== "string" && data2 !== null) {
        const err19 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: schema39.properties.body.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
    if (data.state !== void 0) {
      let data3 = data.state;
      if (typeof data3 !== "string") {
        const err20 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
      if (!(data3 === "open" || data3 === "closed")) {
        const err21 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/enum", keyword: "enum", params: { allowedValues: schema39.properties.state.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
    if (data.url !== void 0) {
      let data4 = data.url;
      if (typeof data4 === "string") {
        if (!formats0(data4)) {
          const err22 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
      } else {
        const err23 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
    if (data.createdAt !== void 0) {
      let data5 = data.createdAt;
      if (typeof data5 === "string") {
        if (!formats2.validate(data5)) {
          const err24 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err24];
          } else {
            vErrors.push(err24);
          }
          errors++;
        }
      } else {
        const err25 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err25];
        } else {
          vErrors.push(err25);
        }
        errors++;
      }
    }
    if (data.updatedAt !== void 0) {
      let data6 = data.updatedAt;
      if (typeof data6 === "string") {
        if (!formats2.validate(data6)) {
          const err26 = { instancePath: instancePath + "/updatedAt", schemaPath: "#/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
      } else {
        const err27 = { instancePath: instancePath + "/updatedAt", schemaPath: "#/properties/updatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
    if (data.closedAt !== void 0) {
      let data7 = data.closedAt;
      if (typeof data7 !== "string" && data7 !== null) {
        const err28 = { instancePath: instancePath + "/closedAt", schemaPath: "#/properties/closedAt/type", keyword: "type", params: { type: schema39.properties.closedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      }
      if (typeof data7 === "string") {
        if (!formats2.validate(data7)) {
          const err29 = { instancePath: instancePath + "/closedAt", schemaPath: "#/properties/closedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err29];
          } else {
            vErrors.push(err29);
          }
          errors++;
        }
      }
    }
    if (data.draft !== void 0) {
      if (typeof data.draft !== "boolean") {
        const err30 = { instancePath: instancePath + "/draft", schemaPath: "#/properties/draft/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err30];
        } else {
          vErrors.push(err30);
        }
        errors++;
      }
    }
    if (data.merged !== void 0) {
      if (typeof data.merged !== "boolean") {
        const err31 = { instancePath: instancePath + "/merged", schemaPath: "#/properties/merged/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err31];
        } else {
          vErrors.push(err31);
        }
        errors++;
      }
    }
    if (data.mergedAt !== void 0) {
      let data10 = data.mergedAt;
      if (typeof data10 !== "string" && data10 !== null) {
        const err32 = { instancePath: instancePath + "/mergedAt", schemaPath: "#/properties/mergedAt/type", keyword: "type", params: { type: schema39.properties.mergedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
      if (typeof data10 === "string") {
        if (!formats2.validate(data10)) {
          const err33 = { instancePath: instancePath + "/mergedAt", schemaPath: "#/properties/mergedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err33];
          } else {
            vErrors.push(err33);
          }
          errors++;
        }
      }
    }
    if (data.headBranch !== void 0) {
      if (typeof data.headBranch !== "string") {
        const err34 = { instancePath: instancePath + "/headBranch", schemaPath: "#/properties/headBranch/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err34];
        } else {
          vErrors.push(err34);
        }
        errors++;
      }
    }
    if (data.baseBranch !== void 0) {
      if (typeof data.baseBranch !== "string") {
        const err35 = { instancePath: instancePath + "/baseBranch", schemaPath: "#/properties/baseBranch/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err35];
        } else {
          vErrors.push(err35);
        }
        errors++;
      }
    }
    if (data.headSha !== void 0) {
      let data13 = data.headSha;
      if (typeof data13 === "string") {
        if (!pattern4.test(data13)) {
          const err36 = { instancePath: instancePath + "/headSha", schemaPath: "#/properties/headSha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
      } else {
        const err37 = { instancePath: instancePath + "/headSha", schemaPath: "#/properties/headSha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err37];
        } else {
          vErrors.push(err37);
        }
        errors++;
      }
    }
  } else {
    const err38 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err38];
    } else {
      vErrors.push(err38);
    }
    errors++;
  }
  validate282.errors = vErrors;
  return errors === 0;
}
validate282.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response6 = validate292;
var schema40 = { "type": "object", "additionalProperties": false, "properties": { "commitSha": { "type": "string", "pattern": "^[0-9a-f]{40}([0-9a-f]{24})?$" }, "generatedAt": { "type": "string", "format": "date-time" }, "items": { "type": "array", "items": { "type": "object", "additionalProperties": false, "properties": { "path": { "type": "string", "minLength": 1, "maxLength": 4096, "description": "DCSWorld/\u307E\u305F\u306FUserMissions/\u914D\u4E0B\u306E\u76F8\u5BFE\u30D1\u30B9\uFF08UTF-8\u30674096\u30D0\u30A4\u30C8\u4EE5\u5185\uFF09\u3002" }, "mode": { "type": "string", "enum": ["100644", "100755", "120000"] }, "type": { "type": "string", "const": "blob" }, "sha": { "type": "string", "pattern": "^[0-9a-f]{40}([0-9a-f]{24})?$" }, "size": { "type": "integer", "minimum": 0 }, "url": { "type": "string", "format": "uri" }, "updatedAt": { "type": ["string", "null"], "format": "date-time" } }, "required": ["path", "mode", "type", "sha", "size", "url", "updatedAt"] }, "maxItems": 1e5 } }, "required": ["commitSha", "generatedAt", "items"] };
function validate292(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate292.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.commitSha === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "commitSha" }, message: "must have required property 'commitSha'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.generatedAt === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "generatedAt" }, message: "must have required property 'generatedAt'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.items === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "items" }, message: "must have required property 'items'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "commitSha" || key0 === "generatedAt" || key0 === "items")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.commitSha !== void 0) {
      let data0 = data.commitSha;
      if (typeof data0 === "string") {
        if (!pattern4.test(data0)) {
          const err4 = { instancePath: instancePath + "/commitSha", schemaPath: "#/properties/commitSha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/commitSha", schemaPath: "#/properties/commitSha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.generatedAt !== void 0) {
      let data1 = data.generatedAt;
      if (typeof data1 === "string") {
        if (!formats2.validate(data1)) {
          const err6 = { instancePath: instancePath + "/generatedAt", schemaPath: "#/properties/generatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/generatedAt", schemaPath: "#/properties/generatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.items !== void 0) {
      let data2 = data.items;
      if (Array.isArray(data2)) {
        if (data2.length > 1e5) {
          const err8 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/maxItems", keyword: "maxItems", params: { limit: 1e5 }, message: "must NOT have more than 100000 items" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        const len0 = data2.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data3 = data2[i0];
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            if (data3.path === void 0) {
              const err9 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
            if (data3.mode === void 0) {
              const err10 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "mode" }, message: "must have required property 'mode'" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
            if (data3.type === void 0) {
              const err11 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            if (data3.sha === void 0) {
              const err12 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "sha" }, message: "must have required property 'sha'" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (data3.size === void 0) {
              const err13 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "size" }, message: "must have required property 'size'" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (data3.url === void 0) {
              const err14 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (data3.updatedAt === void 0) {
              const err15 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            for (const key1 in data3) {
              if (!(key1 === "path" || key1 === "mode" || key1 === "type" || key1 === "sha" || key1 === "size" || key1 === "url" || key1 === "updatedAt")) {
                const err16 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
            if (data3.path !== void 0) {
              let data4 = data3.path;
              if (typeof data4 === "string") {
                if (func12(data4) > 4096) {
                  const err17 = { instancePath: instancePath + "/items/" + i0 + "/path", schemaPath: "#/properties/items/items/properties/path/maxLength", keyword: "maxLength", params: { limit: 4096 }, message: "must NOT have more than 4096 characters" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                if (func12(data4) < 1) {
                  const err18 = { instancePath: instancePath + "/items/" + i0 + "/path", schemaPath: "#/properties/items/items/properties/path/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
              } else {
                const err19 = { instancePath: instancePath + "/items/" + i0 + "/path", schemaPath: "#/properties/items/items/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
            if (data3.mode !== void 0) {
              let data5 = data3.mode;
              if (typeof data5 !== "string") {
                const err20 = { instancePath: instancePath + "/items/" + i0 + "/mode", schemaPath: "#/properties/items/items/properties/mode/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
              }
              if (!(data5 === "100644" || data5 === "100755" || data5 === "120000")) {
                const err21 = { instancePath: instancePath + "/items/" + i0 + "/mode", schemaPath: "#/properties/items/items/properties/mode/enum", keyword: "enum", params: { allowedValues: schema40.properties.items.items.properties.mode.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
            }
            if (data3.type !== void 0) {
              let data6 = data3.type;
              if (typeof data6 !== "string") {
                const err22 = { instancePath: instancePath + "/items/" + i0 + "/type", schemaPath: "#/properties/items/items/properties/type/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
              if ("blob" !== data6) {
                const err23 = { instancePath: instancePath + "/items/" + i0 + "/type", schemaPath: "#/properties/items/items/properties/type/const", keyword: "const", params: { allowedValue: "blob" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data3.sha !== void 0) {
              let data7 = data3.sha;
              if (typeof data7 === "string") {
                if (!pattern4.test(data7)) {
                  const err24 = { instancePath: instancePath + "/items/" + i0 + "/sha", schemaPath: "#/properties/items/items/properties/sha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
              } else {
                const err25 = { instancePath: instancePath + "/items/" + i0 + "/sha", schemaPath: "#/properties/items/items/properties/sha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            }
            if (data3.size !== void 0) {
              let data8 = data3.size;
              if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)))) {
                const err26 = { instancePath: instancePath + "/items/" + i0 + "/size", schemaPath: "#/properties/items/items/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
              if (typeof data8 == "number") {
                if (data8 < 0 || isNaN(data8)) {
                  const err27 = { instancePath: instancePath + "/items/" + i0 + "/size", schemaPath: "#/properties/items/items/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
              }
            }
            if (data3.url !== void 0) {
              let data9 = data3.url;
              if (typeof data9 === "string") {
                if (!formats0(data9)) {
                  const err28 = { instancePath: instancePath + "/items/" + i0 + "/url", schemaPath: "#/properties/items/items/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
                  if (vErrors === null) {
                    vErrors = [err28];
                  } else {
                    vErrors.push(err28);
                  }
                  errors++;
                }
              } else {
                const err29 = { instancePath: instancePath + "/items/" + i0 + "/url", schemaPath: "#/properties/items/items/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err29];
                } else {
                  vErrors.push(err29);
                }
                errors++;
              }
            }
            if (data3.updatedAt !== void 0) {
              let data10 = data3.updatedAt;
              if (typeof data10 !== "string" && data10 !== null) {
                const err30 = { instancePath: instancePath + "/items/" + i0 + "/updatedAt", schemaPath: "#/properties/items/items/properties/updatedAt/type", keyword: "type", params: { type: schema40.properties.items.items.properties.updatedAt.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err30];
                } else {
                  vErrors.push(err30);
                }
                errors++;
              }
              if (typeof data10 === "string") {
                if (!formats2.validate(data10)) {
                  const err31 = { instancePath: instancePath + "/items/" + i0 + "/updatedAt", schemaPath: "#/properties/items/items/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
              }
            }
          } else {
            const err32 = { instancePath: instancePath + "/items/" + i0, schemaPath: "#/properties/items/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err32];
            } else {
              vErrors.push(err32);
            }
            errors++;
          }
        }
      } else {
        const err33 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err33];
        } else {
          vErrors.push(err33);
        }
        errors++;
      }
    }
  } else {
    const err34 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err34];
    } else {
      vErrors.push(err34);
    }
    errors++;
  }
  validate292.errors = vErrors;
  return errors === 0;
}
validate292.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response7 = validate302;
var schema41 = { "type": "object", "additionalProperties": false, "properties": { "commitSha": { "type": "string", "pattern": "^[0-9a-f]{40}([0-9a-f]{24})?$" }, "generatedAt": { "type": "string", "format": "date-time" }, "files": { "type": "array", "items": { "type": "object", "additionalProperties": false, "properties": { "path": { "type": "string", "minLength": 1, "maxLength": 4096, "description": "DCSWorld/\u307E\u305F\u306FUserMissions/\u914D\u4E0B\u306E\u76F8\u5BFE\u30D1\u30B9\uFF08UTF-8\u30674096\u30D0\u30A4\u30C8\u4EE5\u5185\uFF09\u3002" }, "url": { "type": "string", "format": "uri" }, "sha": { "type": "string", "pattern": "^[0-9a-f]{40}([0-9a-f]{24})?$" }, "size": { "type": "integer", "minimum": 0 }, "updatedAt": { "type": ["string", "null"], "format": "date-time" } }, "required": ["path", "url", "sha", "size", "updatedAt"] }, "minItems": 1, "maxItems": 100 } }, "required": ["commitSha", "generatedAt", "files"] };
function validate302(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate302.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.commitSha === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "commitSha" }, message: "must have required property 'commitSha'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.generatedAt === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "generatedAt" }, message: "must have required property 'generatedAt'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.files === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "files" }, message: "must have required property 'files'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "commitSha" || key0 === "generatedAt" || key0 === "files")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.commitSha !== void 0) {
      let data0 = data.commitSha;
      if (typeof data0 === "string") {
        if (!pattern4.test(data0)) {
          const err4 = { instancePath: instancePath + "/commitSha", schemaPath: "#/properties/commitSha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/commitSha", schemaPath: "#/properties/commitSha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.generatedAt !== void 0) {
      let data1 = data.generatedAt;
      if (typeof data1 === "string") {
        if (!formats2.validate(data1)) {
          const err6 = { instancePath: instancePath + "/generatedAt", schemaPath: "#/properties/generatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/generatedAt", schemaPath: "#/properties/generatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.files !== void 0) {
      let data2 = data.files;
      if (Array.isArray(data2)) {
        if (data2.length > 100) {
          const err8 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (data2.length < 1) {
          const err9 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        const len0 = data2.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data3 = data2[i0];
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            if (data3.path === void 0) {
              const err10 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
            if (data3.url === void 0) {
              const err11 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            if (data3.sha === void 0) {
              const err12 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/required", keyword: "required", params: { missingProperty: "sha" }, message: "must have required property 'sha'" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (data3.size === void 0) {
              const err13 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/required", keyword: "required", params: { missingProperty: "size" }, message: "must have required property 'size'" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (data3.updatedAt === void 0) {
              const err14 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            for (const key1 in data3) {
              if (!(key1 === "path" || key1 === "url" || key1 === "sha" || key1 === "size" || key1 === "updatedAt")) {
                const err15 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
            }
            if (data3.path !== void 0) {
              let data4 = data3.path;
              if (typeof data4 === "string") {
                if (func12(data4) > 4096) {
                  const err16 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/properties/path/maxLength", keyword: "maxLength", params: { limit: 4096 }, message: "must NOT have more than 4096 characters" };
                  if (vErrors === null) {
                    vErrors = [err16];
                  } else {
                    vErrors.push(err16);
                  }
                  errors++;
                }
                if (func12(data4) < 1) {
                  const err17 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/properties/path/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
              } else {
                const err18 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/properties/files/items/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            if (data3.url !== void 0) {
              let data5 = data3.url;
              if (typeof data5 === "string") {
                if (!formats0(data5)) {
                  const err19 = { instancePath: instancePath + "/files/" + i0 + "/url", schemaPath: "#/properties/files/items/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
              } else {
                const err20 = { instancePath: instancePath + "/files/" + i0 + "/url", schemaPath: "#/properties/files/items/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
              }
            }
            if (data3.sha !== void 0) {
              let data6 = data3.sha;
              if (typeof data6 === "string") {
                if (!pattern4.test(data6)) {
                  const err21 = { instancePath: instancePath + "/files/" + i0 + "/sha", schemaPath: "#/properties/files/items/properties/sha/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{40}([0-9a-f]{24})?$" }, message: 'must match pattern "^[0-9a-f]{40}([0-9a-f]{24})?$"' };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              } else {
                const err22 = { instancePath: instancePath + "/files/" + i0 + "/sha", schemaPath: "#/properties/files/items/properties/sha/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            if (data3.size !== void 0) {
              let data7 = data3.size;
              if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)))) {
                const err23 = { instancePath: instancePath + "/files/" + i0 + "/size", schemaPath: "#/properties/files/items/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
              if (typeof data7 == "number") {
                if (data7 < 0 || isNaN(data7)) {
                  const err24 = { instancePath: instancePath + "/files/" + i0 + "/size", schemaPath: "#/properties/files/items/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
              }
            }
            if (data3.updatedAt !== void 0) {
              let data8 = data3.updatedAt;
              if (typeof data8 !== "string" && data8 !== null) {
                const err25 = { instancePath: instancePath + "/files/" + i0 + "/updatedAt", schemaPath: "#/properties/files/items/properties/updatedAt/type", keyword: "type", params: { type: schema41.properties.files.items.properties.updatedAt.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
              if (typeof data8 === "string") {
                if (!formats2.validate(data8)) {
                  const err26 = { instancePath: instancePath + "/files/" + i0 + "/updatedAt", schemaPath: "#/properties/files/items/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err26];
                  } else {
                    vErrors.push(err26);
                  }
                  errors++;
                }
              }
            }
          } else {
            const err27 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/properties/files/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
      } else {
        const err28 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      }
    }
  } else {
    const err29 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err29];
    } else {
      vErrors.push(err29);
    }
    errors++;
  }
  validate302.errors = vErrors;
  return errors === 0;
}
validate302.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var body_upsertTreeMetadata = validate312;
function validate312(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate312.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (Array.isArray(data)) {
    if (data.length > 1e3) {
      const err0 = { instancePath, schemaPath: "#/maxItems", keyword: "maxItems", params: { limit: 1e3 }, message: "must NOT have more than 1000 items" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.length < 1) {
      const err1 = { instancePath, schemaPath: "#/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    const len0 = data.length;
    for (let i0 = 0; i0 < len0; i0++) {
      let data0 = data[i0];
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        if (data0.path === void 0) {
          const err2 = { instancePath: instancePath + "/" + i0, schemaPath: "#/items/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (data0.updatedAt === void 0) {
          const err3 = { instancePath: instancePath + "/" + i0, schemaPath: "#/items/required", keyword: "required", params: { missingProperty: "updatedAt" }, message: "must have required property 'updatedAt'" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        for (const key0 in data0) {
          if (!(key0 === "path" || key0 === "updatedAt")) {
            const err4 = { instancePath: instancePath + "/" + i0, schemaPath: "#/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
        if (data0.path !== void 0) {
          let data1 = data0.path;
          if (typeof data1 === "string") {
            if (func12(data1) > 4096) {
              const err5 = { instancePath: instancePath + "/" + i0 + "/path", schemaPath: "#/items/properties/path/maxLength", keyword: "maxLength", params: { limit: 4096 }, message: "must NOT have more than 4096 characters" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (func12(data1) < 1) {
              const err6 = { instancePath: instancePath + "/" + i0 + "/path", schemaPath: "#/items/properties/path/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          } else {
            const err7 = { instancePath: instancePath + "/" + i0 + "/path", schemaPath: "#/items/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
        if (data0.updatedAt !== void 0) {
          let data2 = data0.updatedAt;
          if (typeof data2 === "string") {
            if (!formats2.validate(data2)) {
              const err8 = { instancePath: instancePath + "/" + i0 + "/updatedAt", schemaPath: "#/items/properties/updatedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
          } else {
            const err9 = { instancePath: instancePath + "/" + i0 + "/updatedAt", schemaPath: "#/items/properties/updatedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
        }
      } else {
        const err10 = { instancePath: instancePath + "/" + i0, schemaPath: "#/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
  } else {
    const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "array" }, message: "must be array" };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate312.errors = vErrors;
  return errors === 0;
}
validate312.evaluated = { "items": true, "dynamicProps": false, "dynamicItems": false };
var response8 = validate322;
function validate322(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate322.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.updatedCount === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "updatedCount" }, message: "must have required property 'updatedCount'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "updatedCount")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.updatedCount !== void 0) {
      let data0 = data.updatedCount;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err2 = { instancePath: instancePath + "/updatedCount", schemaPath: "#/properties/updatedCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 > 1e3 || isNaN(data0)) {
          const err3 = { instancePath: instancePath + "/updatedCount", schemaPath: "#/properties/updatedCount/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1e3 }, message: "must be <= 1000" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        if (data0 < 1 || isNaN(data0)) {
          const err4 = { instancePath: instancePath + "/updatedCount", schemaPath: "#/properties/updatedCount/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate322.errors = vErrors;
  return errors === 0;
}
validate322.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response9 = validate33;
function validate33(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate33.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.openapi === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "openapi" }, message: "must have required property 'openapi'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.info === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "info" }, message: "must have required property 'info'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.paths === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "paths" }, message: "must have required property 'paths'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  validate33.errors = vErrors;
  return errors === 0;
}
validate33.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var response10 = validate34;
function validate34(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate34.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func12(data) < 1) {
      const err0 = { instancePath, schemaPath: "#/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate34.errors = vErrors;
  return errors === 0;
}
validate34.evaluated = { "dynamicProps": false, "dynamicItems": false };
var response11 = validate35;
function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate35.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.status === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.timestamp === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "timestamp" }, message: "must have required property 'timestamp'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "status" || key0 === "timestamp")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      let data0 = data.status;
      if (typeof data0 !== "string") {
        const err3 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if ("ok" !== data0) {
        const err4 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/const", keyword: "const", params: { allowedValue: "ok" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.timestamp !== void 0) {
      let data1 = data.timestamp;
      if (typeof data1 === "string") {
        if (!formats2.validate(data1)) {
          const err5 = { instancePath: instancePath + "/timestamp", schemaPath: "#/properties/timestamp/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/timestamp", schemaPath: "#/properties/timestamp/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate35.errors = vErrors;
  return errors === 0;
}
validate35.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var problem = validate36;
var schema47 = { "type": "object", "required": ["type", "title", "status", "detail", "instance", "code"], "properties": { "type": { "type": "string", "format": "uri" }, "title": { "type": "string" }, "status": { "type": "integer", "minimum": 400, "maximum": 599 }, "detail": { "type": "string", "description": "\u30A8\u30E9\u30FC\u306E\u8A73\u7D30\u3002" }, "instance": { "type": "string", "format": "uri-reference", "description": "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u305F\u30EA\u30AF\u30A8\u30B9\u30C8\u306E\u30D1\u30B9\u3002" }, "code": { "type": "string", "enum": ["INVALID_REQUEST", "INVALID_CURSOR", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "METHOD_NOT_ALLOWED", "NOT_ACCEPTABLE", "CONFLICT", "REPLAY_DETECTED", "PAYLOAD_TOO_LARGE", "URI_TOO_LONG", "UNSUPPORTED_MEDIA_TYPE", "UNPROCESSABLE_CONTENT", "SNAPSHOT_LIMIT_EXCEEDED", "RATE_LIMITED", "INTERNAL_ERROR", "UPSTREAM_ERROR", "SERVICE_UNAVAILABLE"] } }, "additionalProperties": true, "description": "RFC 9457\u5F62\u5F0F\u306E\u30A8\u30E9\u30FC\u60C5\u5831\u3002" };
function validate36(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate36.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.type === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.status === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.detail === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "detail" }, message: "must have required property 'detail'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.instance === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "instance" }, message: "must have required property 'instance'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.code === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.type !== void 0) {
      let data0 = data.type;
      if (typeof data0 === "string") {
        if (!formats0(data0)) {
          const err6 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.title !== void 0) {
      if (typeof data.title !== "string") {
        const err8 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      let data2 = data.status;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err9 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 > 599 || isNaN(data2)) {
          const err10 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/maximum", keyword: "maximum", params: { comparison: "<=", limit: 599 }, message: "must be <= 599" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (data2 < 400 || isNaN(data2)) {
          const err11 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/minimum", keyword: "minimum", params: { comparison: ">=", limit: 400 }, message: "must be >= 400" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
    }
    if (data.detail !== void 0) {
      if (typeof data.detail !== "string") {
        const err12 = { instancePath: instancePath + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.instance !== void 0) {
      let data4 = data.instance;
      if (typeof data4 === "string") {
        if (!formats10.test(data4)) {
          const err13 = { instancePath: instancePath + "/instance", schemaPath: "#/properties/instance/format", keyword: "format", params: { format: "uri-reference" }, message: 'must match format "uri-reference"' };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/instance", schemaPath: "#/properties/instance/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.code !== void 0) {
      let data5 = data.code;
      if (typeof data5 !== "string") {
        const err15 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
      if (!(data5 === "INVALID_REQUEST" || data5 === "INVALID_CURSOR" || data5 === "UNAUTHENTICATED" || data5 === "FORBIDDEN" || data5 === "NOT_FOUND" || data5 === "METHOD_NOT_ALLOWED" || data5 === "NOT_ACCEPTABLE" || data5 === "CONFLICT" || data5 === "REPLAY_DETECTED" || data5 === "PAYLOAD_TOO_LARGE" || data5 === "URI_TOO_LONG" || data5 === "UNSUPPORTED_MEDIA_TYPE" || data5 === "UNPROCESSABLE_CONTENT" || data5 === "SNAPSHOT_LIMIT_EXCEEDED" || data5 === "RATE_LIMITED" || data5 === "INTERNAL_ERROR" || data5 === "UPSTREAM_ERROR" || data5 === "SERVICE_UNAVAILABLE")) {
        const err16 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/enum", keyword: "enum", params: { allowedValues: schema47.properties.code.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  } else {
    const err17 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err17];
    } else {
      vErrors.push(err17);
    }
    errors++;
  }
  validate36.errors = vErrors;
  return errors === 0;
}
validate36.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
export {
  requests_exports as requests,
  responses_exports as responses
};
